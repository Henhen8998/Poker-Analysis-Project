"""No-limit betting rounds. Cards and showdown evaluation are separate concerns."""
from dataclasses import dataclass
from .math import amount


@dataclass
class Player:
    stack: int
    bet: int = 0
    contributed: int = 0
    folded: bool = False


class Hand:
    def __init__(self, stacks, button, small_blind, big_blind):
        if not 2 <= len(stacks) <= 9 or not 0 <= button < len(stacks):
            raise ValueError("Need 2–9 occupied seats and a valid button")
        for x in [*stacks, small_blind, big_blind]:
            amount(x)
        if not all(stacks) or not 0 < small_blind <= big_blind:
            raise ValueError("Stacks and blinds must be positive; SB <= BB")
        self.players = [Player(s) for s in stacks]
        self.button, self.big_blind = button, big_blind
        self.street, self.current, self.increment = 0, big_blind, big_blind
        self.acted_at = {}
        self.history = []
        sb = button if len(stacks) == 2 else (button + 1) % len(stacks)
        bb = (sb + 1) % len(stacks)
        self._pay(sb, min(small_blind, stacks[sb]))
        self._pay(bb, min(big_blind, stacks[bb]))
        self.pending = set(self._able())
        self.actor = self._next(bb)
        self._settle()

    def _able(self):
        return [i for i, p in enumerate(self.players) if p.stack and not p.folded]

    def _next(self, after):
        return next(((after + k) % len(self.players) for k in range(1, len(self.players) + 1)
                     if (after + k) % len(self.players) in self.pending), None)

    def _pay(self, i, chips):
        p = self.players[i]
        p.stack -= chips
        p.bet += chips
        p.contributed += chips

    @property
    def pot(self):
        return sum(p.contributed for p in self.players)

    def _settle(self):
        live = [p for p in self.players if not p.folded]
        if len(live) == 1:
            self.pending.clear()
        able = self._able()
        if len(able) == 1 and self.players[able[0]].bet >= self.current:
            self.pending.clear()
        if not self.pending:
            self.actor = None

    def legal(self):
        if self.actor is None:
            return {}
        p = self.players[self.actor]
        due = max(0, self.current - p.bet)
        result = {"fold": 0, "call" if due else "check": min(due, p.stack)}
        reopened = self.actor not in self.acted_at or self.current - self.acted_at[self.actor] >= self.increment
        if reopened and p.bet + p.stack > self.current and len(self._able()) > 1:
            result["raise_to"] = min(p.bet + p.stack, self.current + self.increment)
        return result

    def act(self, action, target=None):
        legal = self.legal()
        if action not in legal:
            raise ValueError("Illegal action")
        i, p = self.actor, self.players[self.actor]
        if action == "raise_to":
            amount(target)
            if not legal[action] <= target <= p.bet + p.stack:
                raise ValueError("Raise below minimum or above stack")
            increase = target - self.current
            self._pay(i, target - p.bet)
            if increase >= self.increment:
                self.increment = increase
            self.current = target
            self.pending.update(j for j in self._able() if j != i and self.players[j].bet < target)
        elif action == "fold":
            p.folded = True
        else:
            self._pay(i, legal[action])
        self.acted_at[i] = self.current
        self.pending.discard(i)
        self.history.append((self.street, i, action, target))
        self.actor = self._next(i)
        self._settle()

    def advance(self):
        if self.pending or self.street == 3 or sum(not p.folded for p in self.players) < 2:
            raise ValueError("Cannot advance street")
        self.street += 1
        self.current, self.increment = 0, self.big_blind
        self.acted_at.clear()
        for p in self.players:
            p.bet = 0
        self.pending = set(self._able()) if len(self._able()) > 1 else set()
        self.actor = self._next(self.button)

    def pots(self):
        """Contribution layers; single-contributor layers are uncalled refunds."""
        layers, previous = [], 0
        for level in sorted({p.contributed for p in self.players if p.contributed}):
            contributors = [i for i, p in enumerate(self.players) if p.contributed >= level]
            layers.append(dict(amount=(level - previous) * len(contributors),
                               eligible=[i for i in contributors if not self.players[i].folded],
                               refund_to=contributors[0] if len(contributors) == 1 else None))
            previous = level
        return layers
