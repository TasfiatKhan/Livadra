from rest_framework import serializers


class TextingRequestSerializer(serializers.Serializer):
    conversation = serializers.CharField()
    user_request = serializers.CharField()


class LiveRequestSerializer(serializers.Serializer):
    situation = serializers.CharField()
    user_request = serializers.CharField()
