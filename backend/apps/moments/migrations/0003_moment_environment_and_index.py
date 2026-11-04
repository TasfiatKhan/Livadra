from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('moments', '0002_momentmessage_response_record'),
    ]

    operations = [
        migrations.AddField(
            model_name='moment',
            name='environment',
            field=models.CharField(blank=True, default='', max_length=300),
        ),
        migrations.AddIndex(
            model_name='moment',
            index=models.Index(
                fields=['user', 'is_archived', '-last_active_at'],
                name='moments_mom_user_id_0b6679_idx',
            ),
        ),
    ]
