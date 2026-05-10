from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('responses', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CopiedResponse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('option_type', models.CharField(choices=[('safe', 'Safe'), ('playful', 'Playful'), ('bold', 'Bold')], max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('response_record', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='copies', to='responses.airesponserecord')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='copied_responses', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='copiedresponse',
            unique_together={('user', 'response_record', 'option_type')},
        ),
    ]
