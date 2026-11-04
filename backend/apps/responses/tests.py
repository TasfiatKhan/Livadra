from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User
from .models import AIResponseRecord, SavedResponse
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


class SavedResponseDeleteTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='a@example.com', password='pw-12345678')
        self.other = User.objects.create_user(email='b@example.com', password='pw-12345678')
        record = AIResponseRecord.objects.create(user=self.user, mode='texting', response_json={'options': []})
        self.saved = SavedResponse.objects.create(
            user=self.user, response_record=record, option_type='safe', option_text='Hey',
        )

    def test_owner_removes_saved_response(self):
        self.client.force_authenticate(self.user)
        res = self.client.delete(f'/api/responses/saved/{self.saved.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SavedResponse.objects.exists())

    def test_other_user_cannot_remove_saved_response(self):
        self.client.force_authenticate(self.other)
        res = self.client.delete(f'/api/responses/saved/{self.saved.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(SavedResponse.objects.exists())
