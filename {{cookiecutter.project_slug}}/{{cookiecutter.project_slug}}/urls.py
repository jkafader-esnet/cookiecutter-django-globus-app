from api.urls import router

from {{ cookiecutter.project_slug }}.views import (
    landing_page,
    transfer_page,
    CustomSearch,
    TransferView,
)

from django.urls import path, include
from globus_portal_framework.urls import register_custom_index

register_custom_index('osn_index', ['terrafusion'])

urlpatterns = [
    # Provides the basic search portal
    path("api-auth/", include("rest_framework.urls")),
    path("api/", include(router.urls)),
    
    path("", landing_page, name="landing-page"),

    #jo changes
    path("transfers/", TransferView.as_view(), name="transfer-page"),

    
    path("<osn_index:index>", CustomSearch.as_view(), name="search"),
    
    path("", include("globus_portal_framework.urls")),
    path("", include("social_django.urls", namespace="social")),
]
