from django.conf import settings
from django.db import models

from .questions import sus_grade


class Response(models.Model):
    """One completed questionnaire, from one signed-in Google account (the database allows only one per account
    and per email). Name and occupation get their own columns; every other answer is kept in `answers` under its
    question code (SUS1 … L1 … liked), see questions.py."""
    created_at = models.DateTimeField('submitted', auto_now_add=True, db_index=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                                related_name='feedback')
    email = models.EmailField(unique=True, null=True, blank=True, help_text='the Google account that sent it')
    name = models.CharField(max_length=100)
    occupation = models.CharField(max_length=120)
    answers = models.JSONField(default=dict)
    sus_score = models.FloatField('SUS score', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'feedback response'

    def __str__(self):
        return f'{self.name} ({self.occupation}), {self.created_at:%Y-%m-%d %H:%M}'

    @property
    def sus_grade(self):
        return sus_grade(self.sus_score)
