from django.contrib.auth.models import User
from django.contrib.auth import login
from django.conf import settings
from django_slack_oauth.models import SlackUser

def register_user(request, api_data):
    if api_data['team']['id'] == settings.SLACK_TEAM_ID:
        user, created = User.objects.update_or_create(
            username=api_data['user']['id'],
            defaults={'email': api_data['user']['email']}
        )

        slacker, _ = SlackUser.objects.get_or_create(slacker=user)
        slacker.access_token = api_data.pop('access_token')
        slacker.extras = api_data
        slacker.save()

        login(request, user)
    return request, api_data
