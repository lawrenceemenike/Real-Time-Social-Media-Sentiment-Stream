import pytest
from src.transformation.watchlist_router import WatchlistRouter

def test_watchlist_router_matches_telecom():
    router = WatchlistRouter()
    
    # 1. Direct mention of MTN
    matched, wls, kw = router.route_event("I think MTN data is very reliable.")
    assert matched is True
    assert "telecom_ng" in wls
    assert any("mtn" in k.lower() for k in kw)

    # 2. Topic match without brand name
    matched, wls, kw = router.route_event("Experiencing a network issue and slow internet today.")
    assert matched is True
    assert "telecom_ng" in wls

    # 3. Irrelevant conversational text
    matched, wls, kw = router.route_event("Going to sleep early tonight, sweet dreams everyone!")
    assert matched is False
    assert len(wls) == 0

def test_canonical_entity_resolution():
    router = WatchlistRouter()
    assert router.resolve_canonical_entity("telecom_ng", "yello") == "MTN Nigeria"
    assert router.resolve_canonical_entity("telecom_ng", "airtelng") == "Airtel Nigeria"
    assert router.resolve_canonical_entity("telecom_ng", "glo") == "Glo Nigeria"
