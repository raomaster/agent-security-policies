# Vulnerable: XSS via mark_safe on user input
from django.http import HttpResponse
from django.utils.safestring import mark_safe

def profile_view(request, username):
    # User-controlled username rendered without escaping
    html = mark_safe(f"<h1>Welcome, {username}!</h1>")
    return HttpResponse(html)

def search_view(request):
    query = request.GET.get('q', '')
    # Double vulnerability: f-string in response AND mark_safe
    result = mark_safe(f'<p>Searching for: {query}</p>')
    return HttpResponse(f"<html><body>{result}</body></html>")