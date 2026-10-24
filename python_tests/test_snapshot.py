import pytest
from fastapi.testclient import TestClient
from backend.api import app, parse_money
from poker_lab.math import icm

client = TestClient(app)


def snapshot():
    return dict(seats=[dict(name=f'Player {i}', stack=50000, occupied=True) for i in range(9)],
                hero=0, dealer=4, small_blind=200, big_blind=500, pot=15000,
                facing=5000, street='River', hole=['As', 'Kh'],
                board=['Qs', 'Jd', '7c', '2h', '9s'])


def test_known_pot_odds():
    result = client.post('/api/analyze', json=snapshot()).json()
    assert result['required_equity'] == .25
    assert result['final_pot'] == 20000
    assert result['pot_odds_ratio'] == 3
    assert result['recommendation'] is None
    assert result['actions'] == ['Fold', 'Call']


@pytest.mark.parametrize('text,unit,bb,expected', [('500','USD',500,50000),('100','BB',500,50000),('15','BB',500,7500),('0.01','USD',2,1),('0.2','BB',5,1)])
def test_exact_money(text, unit, bb, expected):
    assert parse_money(text,unit,bb) == expected


@pytest.mark.parametrize('text', ['NaN','Infinity','-1','0.001','oops','1e1000000'])
def test_invalid_money(text):
    with pytest.raises(ValueError):
        parse_money(text,'USD',500)


def test_short_stack_requires_eligibility():
    data=snapshot();data['seats'][0]['stack']=3000
    assert client.post('/api/analyze',json=data).status_code == 422
    data['eligible_pot']=13000
    result=client.post('/api/analyze',json=data).json()
    assert result['call']==3000
    assert result['required_equity']==3000/16000
    data['eligible_pot']=16000
    assert client.post('/api/analyze',json=data).status_code==422


@pytest.mark.parametrize('change', [dict(hole=['As','As']),dict(board=['As','Jd','7c','2h','9s']),dict(street='Flop'),dict(small_blind=1000),dict(pot=-1),dict(pot=1.5),dict(facing=-1),dict(hero=10)])
def test_invalid_snapshots(change):
    data=snapshot();data.update(change)
    assert client.post('/api/analyze',json=data).status_code==422


def test_heads_up_and_empty_seats():
    data=snapshot()
    for i in range(1,9):data['seats'][i]['occupied']=i==4
    assert client.post('/api/analyze',json=data).status_code==200
    data['seats'][4]['occupied']=False
    assert client.post('/api/analyze',json=data).status_code==422


def test_free_check():
    data=snapshot();data['facing']=0
    r=client.post('/api/analyze',json=data).json()
    assert r['required_equity']==0
    assert r['actions']==['Check']


def test_icm_conservation_and_complete_field():
    assert icm([100,100,100],[60,30],3)==(30,30,30)
    assert sum(icm([50,100,200],[60,30,10],3))==100
    with pytest.raises(ValueError):icm([100]*9,[100],18)
