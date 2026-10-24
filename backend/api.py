"""Phase 1 snapshot API. No implicit reconstruction or strategic recommendations."""
from decimal import Decimal, DecimalException
from typing import Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from poker_lab.math import call_metrics

app = FastAPI(title="AI Poker Strategy Lab", version="0.1.0")


def parse_money(text: str, unit: str, big_blind: int) -> int:
    try:
        value = Decimal(text) * (100 if unit == "USD" else big_blind)
        if not value.is_finite() or value < 0 or value != value.to_integral_value() or value > 10**12:
            raise ValueError()
        return int(value)
    except (DecimalException, ValueError):
        raise ValueError("Enter a nonnegative amount representable in whole cents (maximum $10 billion)")


class Money(BaseModel):
    text: str
    unit: Literal["USD", "BB"]
    big_blind: int = Field(gt=0, le=10**12)


@app.post("/api/money")
def money(data: Money):
    try:
        return {"cents": parse_money(data.text, data.unit, data.big_blind)}
    except ValueError as error:
        raise HTTPException(422, str(error))


class Seat(BaseModel):
    name: str = Field(max_length=40)
    stack: int = Field(ge=0, le=10**12, strict=True)
    occupied: bool


class Snapshot(BaseModel):
    seats: list[Seat] = Field(min_length=9, max_length=9)
    hero: int = Field(ge=0, le=8)
    dealer: int = Field(ge=0, le=8)
    small_blind: int = Field(gt=0, strict=True)
    big_blind: int = Field(gt=0, strict=True)
    pot: int = Field(ge=0, le=10**12, strict=True)
    facing: int = Field(ge=0, le=10**12, strict=True)
    street: Literal["Preflop", "Flop", "Turn", "River"]
    hole: list[str] = Field(min_length=2, max_length=2)
    board: list[str] = Field(min_length=5, max_length=5)
    eligible_pot: int | None = Field(default=None, ge=0, strict=True)


@app.post("/api/analyze")
def analyze(data: Snapshot):
    def reject(message):
        raise HTTPException(422, message)
    occupied = [i for i, seat in enumerate(data.seats) if seat.occupied]
    if len(occupied) < 2 or data.hero not in occupied or data.dealer not in occupied:
        reject("Need 2–9 occupied seats, including Hero and the dealer")
    if data.small_blind > data.big_blind:
        reject("Small blind must not exceed big blind")
    if data.seats[data.hero].stack == 0:
        reject("Hero needs a positive remaining stack for a decision")
    deck = {r+s for r in "23456789TJQKA" for s in "shdc"}
    count = {"Preflop": 0, "Flop": 3, "Turn": 4, "River": 5}[data.street]
    cards = data.hole + data.board[:count]
    if any(c not in deck for c in cards) or any(data.board[count:]):
        reject("Enter two hole cards and exactly the board cards for the selected street")
    if len(cards) != len(set(cards)):
        reject("Cards must be unique")
    actual_call = min(data.facing, data.seats[data.hero].stack)
    short = actual_call < data.facing
    if short and data.eligible_pot is None:
        reject("Short-stack call: enter the pot Hero is eligible to win before calling; exclude excess bets and side pots")
    pot = data.eligible_pot if short else data.pot
    if pot is None or pot > data.pot:
        reject("Eligible pot cannot exceed the total pot")
    if pot + actual_call == 0:
        reject("Enter a positive pot or call amount")
    metrics = call_metrics(pot, actual_call, 0)
    return {"call": actual_call, "pot_before_call": pot, "final_pot": metrics["final_pot"],
            "required_equity": float(metrics["break_even"]),
            "pot_odds_ratio": pot / actual_call if actual_call else None,
            "actions": ["Fold", "Call"] if actual_call else ["Check"],
            "short_call": short, "recommendation": None,
            "assumptions": ["Manual snapshot; previous actions are unknown", "No rake or future betting",
                            "Equal eligibility in the specified pot; no side-pot EV model",
                            "Equity, bet/raise legality and strategy are not modeled in Phase 1"]}
