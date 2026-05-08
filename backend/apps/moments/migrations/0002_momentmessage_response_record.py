from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('moments', '0001_initial'),
        ('responses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='momentmessage',
            name='response_record',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='moment_messages',
                to='responses.airesponserecord',
            ),
        ),
    ]
