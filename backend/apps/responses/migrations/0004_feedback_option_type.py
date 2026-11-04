from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('responses', '0003_savedresponse_unique_together'),
    ]

    operations = [
        migrations.AddField(
            model_name='responsefeedback',
            name='option_type',
            field=models.CharField(
                blank=True,
                choices=[('safe', 'Safe'), ('playful', 'Playful'), ('bold', 'Bold')],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AlterUniqueTogether(
            name='responsefeedback',
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name='responsefeedback',
            constraint=models.UniqueConstraint(
                fields=('user', 'response_record', 'option_type'),
                name='one_feedback_per_user_response_option',
            ),
        ),
    ]
