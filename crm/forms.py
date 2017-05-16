from address.forms import AddressField
from django import forms
from . import models

class ImportForm(forms.Form):
    csv_data = forms.CharField(widget=forms.widgets.Textarea())

class ActivistSearchForm(forms.Form):
    city_filter = AddressField(label='Search within city', required=False)

class EmailForm(forms.Form):
    subject = forms.CharField(label='Subject')
    body = forms.CharField(label='Body', widget=forms.widgets.Textarea())
    to = forms.ChoiceField(label='To', choices=models.SignupState.choices())

class FormForm(forms.Form):
    name = forms.CharField(label='Name')
    email = forms.CharField(label='Email')
    phone = forms.CharField(label='Phone number', required=False)
    address = AddressField(required=False)

    @staticmethod
    def form_field(field):
        type = models.FormControlType(int(field.control_type))
        if (type == models.FormControlType.boolean):
            return forms.BooleanField(label=field.name)
        if (type == models.FormControlType.text):
            return forms.CharField(label=field.name)
        if (type == models.FormControlType.multiple_choice):
            choices = map(lambda x: (x, x), field.control_data.split("\n"))
            return forms.ChoiceField(label=field.name, choices=choices,
                    widget=forms.widgets.SelectMultiple)
        if (type == models.FormControlType.options):
            choices = map(lambda x: (x, x), field.control_data.split("\n"))
            return forms.ChoiceField(label=field.name, choices=choices,
                    widget=forms.widgets.RadioSelect)

    def __init__(self, form_obj, *args, **kwargs):
        super(FormForm, self).__init__(*args, **kwargs)
        self.custom_fields = {}
        for field in form_obj.fields.all():
            field_name = "field_%s"%(field.id)
            self.fields[field_name] = self.form_field(field)
            self.custom_fields[field.id] = field_name
