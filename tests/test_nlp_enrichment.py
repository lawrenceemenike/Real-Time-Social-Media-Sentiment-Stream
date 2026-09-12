import pytest
from src.nlp.sentiment import SentimentAnalyzer
from src.nlp.entities import EntityExtractor
from src.nlp.intent import CommercialIntentClassifier
from src.nlp.topics import TopicClassifier

def test_identifies_switching_intent_correctly():
    text = "Data prices are crazy, I am moving from MTN to Airtel tomorrow."
    intent = CommercialIntentClassifier.classify(text, ["MTN", "Airtel"])
    assert intent.category == "switching_intent"
    assert "Airtel" in intent.target_competitor

def test_identifies_complaint_intent():
    text = "Network outage again! Absolutely terrible service."
    intent = CommercialIntentClassifier.classify(text, [])
    assert intent.category == "complaint"

def test_identifies_pricing_discussion():
    text = "Their data tariff and recharge costs are getting out of hand."
    intent = CommercialIntentClassifier.classify(text, [])
    assert intent.category == "pricing_discussion"

def test_sentiment_scoring_positive_and_negative():
    pos_res = SentimentAnalyzer.analyze("I really love the fast speeds on this network, superb service!")
    assert pos_res.label == "positive"
    assert pos_res.score > 0.0

    neg_res = SentimentAnalyzer.analyze("Terrible network outage, useless customer service, totally broken.")
    assert neg_res.label == "negative"
    assert neg_res.score < 0.0

def test_entity_extractor_normalizes_aliases():
    text = "Both MTN and AirtelNG are competing in Lagos, but Glo is cheaper."
    entities = EntityExtractor.extract_entities(text)
    names = [e.normalized_name for e in entities]
    assert "MTN Nigeria" in names
    assert "Airtel Nigeria" in names
    assert "Glo Nigeria" in names

def test_topic_classifier_identifies_topics():
    topics = TopicClassifier.classify_topics("The data price in Nigeria is increasing while customer service is silent.")
    assert "Data Price" in topics
    assert "Customer Service" in topics
