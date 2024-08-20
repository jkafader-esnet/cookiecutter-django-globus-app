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

def transfer_page(request):
    context = {}
    return render(request, "globus-portal-framework/v2/components/transfer/list.html", context)


class CustomSearch(SliderFacetsMixin, SearchView):
    """Search with Slider Facets enabled."""
    pass

