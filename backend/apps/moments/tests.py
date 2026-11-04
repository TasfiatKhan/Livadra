from rest_framework import status
from rest_framework.test import APITestCase

from apps.responses.models import AIResponseRecord, SavedResponse
from apps.users.models import User
from .models import Moment, MomentMessage


class MomentDeleteTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='a@example.com', password='pw-12345678')
        self.other = User.objects.create_user(email='b@example.com', password='pw-12345678')
        self.moment = Moment.objects.create(
            user=self.user, title='Team lunch', relationship_context='coworker', mode='texting',
        )
        self.record = AIResponseRecord.objects.create(
            user=self.user, mode='moments', response_json={'options': []},
        )
        MomentMessage.objects.create(moment=self.moment, role='user', content='Hi')
        MomentMessage.objects.create(
            moment=self.moment, role='assistant', content='{}', response_record=self.record,
        )
        SavedResponse.objects.create(
            user=self.user, response_record=self.record, option_type='safe', option_text='Hey',
        )

    def test_owner_deletes_moment_and_its_response_records(self):
        self.client.force_authenticate(self.user)
        res = self.client.delete(f'/api/moments/{self.moment.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Moment.objects.filter(id=self.moment.id).exists())
        self.assertFalse(MomentMessage.objects.exists())
        self.assertFalse(AIResponseRecord.objects.filter(id=self.record.id).exists())
        self.assertFalse(SavedResponse.objects.exists())

    def test_other_user_cannot_delete_moment(self):
        self.client.force_authenticate(self.other)
        res = self.client.delete(f'/api/moments/{self.moment.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Moment.objects.filter(id=self.moment.id).exists())
