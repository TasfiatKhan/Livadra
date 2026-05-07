from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0005_userprofile_social_anxiety_level'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='persona_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('storyteller', 'The Storyteller'),
                    ('charmer', 'The Charmer'),
                    ('observer', 'The Observer'),
                    ('witty', 'The Witty One'),
                    ('confident', 'The Confident One'),
                ],
                default='',
                max_length=20,
            ),
        ),
    ]
