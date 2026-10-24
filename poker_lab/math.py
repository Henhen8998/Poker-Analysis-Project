"""Decision-point chip EV and exact Independent Chip Model prize equity."""
from functools import lru_cache
from fractions import Fraction


def amount(value):
    if type(value) is not int or value < 0:
        raise ValueError("Amounts must be nonnegative integer minor units")
    return value


def call_metrics(pot, call, equity):
    """Pot includes the bet faced. Terminal, equal eligibility, no rake model."""
    amount(pot)
    amount(call)
    if not 0 <= equity <= 1 or pot + call == 0:
        raise ValueError("Need equity in [0,1] and a positive final pot")
    final = pot + call
    return dict(final_pot=final, break_even=Fraction(call, final),
                call_ev=equity * final - call, fold_ev=0)


def icm(stacks, payouts, players_remaining):
    """Exact subset recursion; require the complete field, up to 12 players.

    First place probability is proportional to chips; recursively remove the
    winner and allocate the next prize. Payouts are descending remaining prizes.
    """
    stacks, payouts = tuple(stacks), tuple(payouts)
    n = len(stacks)
    if n != players_remaining or not 1 <= n <= 12:
        raise ValueError("Supply every remaining stack; exact ICM supports 1–12 players")
    for x in stacks + payouts:
        amount(x)
    if any(x == 0 for x in stacks) or len(payouts) > n:
        raise ValueError("Remaining players need positive stacks and at most n prizes")
    if any(a < b for a, b in zip(payouts, payouts[1:])):
        raise ValueError("Payouts must descend")
    prizes = payouts + (0,) * (n - len(payouts))

    @lru_cache(None)
    def solve(mask):
        place = n - mask.bit_count()
        if not mask:
            return (Fraction(0),) * n
        total = sum(stacks[i] for i in range(n) if mask & (1 << i))
        result = [Fraction(0)] * n
        for i in range(n):
            if mask & (1 << i):
                p = Fraction(stacks[i], total)
                tail = solve(mask ^ (1 << i))
                for j in range(n):
                    result[j] += p * (prizes[place] if j == i else tail[j])
        return tuple(result)
    return solve((1 << n) - 1)
