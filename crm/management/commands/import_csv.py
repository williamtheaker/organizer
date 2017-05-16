from django.core.management.base import BaseCommand, CommandError
import sys
from crm import importing

class Command(BaseCommand):
    def handle(self, *args, **options):
        imp = importing.Importer(sys.stdin)
        for activist in imp:
            print unicode(activist)
