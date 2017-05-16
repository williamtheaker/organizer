from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from mailchimp3 import MailChimp
from mailchimp import models
from crm.models import Activist, Action

class Command(BaseCommand):
    def handle(self, *args, **options):
        client = MailChimp(settings.MAILCHIMP_USERNAME,
                settings.MAILCHIMP_SECRET_KEY)
        for list in client.lists.all(get_all=True,
                fields="lists.name,lists.id")['lists']:
            list_obj, _ = models.List.objects.update_or_create(mailchimp_id=list['id'],
                    defaults={'name': list['name']})
            if list_obj.is_activist_source:
                for subscription in client.lists.members.all(get_all=True, list_id=list_obj.mailchimp_id)['members']:
                    activist, _ = Activist.objects.get_or_create(email=subscription['email_address'],
                            defaults={
                                'name': "%s %s"%(subscription['merge_fields']['FNAME'], subscription['merge_fields']['LNAME']),
                                'address': subscription['merge_fields']['ZIPCODE']
                            })
                    print "Synced", activist
