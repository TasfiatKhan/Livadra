from django.test import SimpleTestCase
from .serializers import AIResponseOutputSerializer


class AIResponseOutputSerializerTests(SimpleTestCase):
    def test_accepts_exactly_one_of_each_option_type(self):
        serializer = AIResponseOutputSerializer(data={
            'options': [
                {'type': 'safe', 'text': 'A', 'note': 'A note'},
                {'type': 'playful', 'text': 'B', 'note': 'B note'},
                {'type': 'bold', 'text': 'C', 'note': 'C note'},
            ],
            'delivery': 'Keep it relaxed.',
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_rejects_duplicate_option_types(self):
        serializer = AIResponseOutputSerializer(data={
            'options': [
                {'type': 'safe', 'text': 'A', 'note': 'A note'},
                {'type': 'safe', 'text': 'B', 'note': 'B note'},
                {'type': 'bold', 'text': 'C', 'note': 'C note'},
            ],
            'delivery': 'Keep it relaxed.',
        })
        self.assertFalse(serializer.is_valid())

