from {{ cookiecutter.project_slug }}.mixins import SliderFacetsMixin
from {{ cookiecutter.project_slug }}.generic_views import SearchView

from django.conf import settings
from django.shortcuts import render
from django.views.generic.base import TemplateView

import globus_sdk
import logging

log = logging.getLogger(__name__)


def landing_page(request):
    context = {}
    return render(request, "globus-portal-framework/v2/landing-page.html", context)


class TransferView(TemplateView):
    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context["collections"] = settings.globus.collections
        return context

    template_name = "globus-portal-framework/v2/components/transfer/list.html"


class CustomSearch(SliderFacetsMixin, SearchView):
    """Search with Slider Facets enabled."""
    pass


