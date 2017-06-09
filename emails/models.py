# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from crm.models import Activist
from anymail.signals import tracking
from django.dispatch import receiver
import functools
from datetime import datetime
from django.template import loader, engines
from django.core.mail import EmailMessage
import django_rq

def send_email(email_obj, activist, templated_email):
    status = email_obj.send()
    MailSubmission.objects.create(
        email=templated_email,
        to=activist,
        message_id=email_obj.anymail_status.message_id
    )

class TemplatedEmail(models.Model):
    subject = models.CharField(max_length=200)
    body = models.TextField()

    def to_template(self):
        return engines['django'].from_string(self.body)

    def send_to_activists(self, activists, reply_to):
        email_template = loader.get_template('email.eml')
        for activist in activists:
            if activist.do_not_email:
                print "Not emailing", activist
                continue
            generated_email = email_template.render({
                'activist': activist,
                'body': self.to_template().render({'activist': activist})
            })
            email_obj = EmailMessage(
                subject=self.subject,
                body=generated_email,
                to=[activist.email],
                reply_to=[reply_to],
            )
            email_obj.encoding = 'utf-8'
            django_rq.enqueue(send_email, email_obj, activist, self)

    def __unicode__(self):
        return self.subject

class MailSubmission(models.Model):
    to = models.ForeignKey(Activist, related_name='email_recipients')
    email = models.ForeignKey(TemplatedEmail, related_name='recipients')
    created = models.DateTimeField(auto_now_add=True)
    delivered = models.DateTimeField(default=None, blank=True)
    opened = models.DateTimeField(default=None, blank=True)
    bounced = models.BooleanField(default=False)
    message_id = models.TextField()

    def __unicode__(self):
        return "%s to %s"%(self.email, self.to.email)

def handler(event_type):
    def wrapper(f):
        @functools.wraps(f)
        def wrapped(sender, event, esp_name, *args, **kwargs):
            submission = MailSubmission.objects.get(message_id=event.message_id)
            if event.event_type == event_type:
                return f(submission, event, *args, **kwargs)
    return wrapper

@handler("unsubscribed")
def handle_unsubscribe(submission, event):
    activist = submission.activist
    activist.do_not_email = True
    activist.save()

@handler("bounced")
def handle_bounce(submission, event):
    submission.bounced = True
    submission.save()

@handler("delivered")
def handle_delivery(submission, event):
    submission.delivered = datetime.now()
    submission.save()

@handler("opened")
def handle_deliverY(submission, event):
    submission.opened = datetime.now()
    submission.save()
