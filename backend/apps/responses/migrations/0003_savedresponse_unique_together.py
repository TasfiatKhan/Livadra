from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('responses', '0002_copiedresponse'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='savedresponse',
            unique_together={('user', 'response_record', 'option_type')},
        ),
    ]
