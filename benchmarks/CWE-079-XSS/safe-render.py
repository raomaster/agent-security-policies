# Safe: Uses django.utils.html.escape
from django.http import HttpResponse
from django.utils.html import escape

def profile_view(request, username):
    # Properly escaped - safe
    safe_name = escape(username)
    html = f"<h1>Welcome, {safe_name}!</h1>"
    return HttpResponse(html)

def search_view(request):
    query = request.GET.get('q', '')
    # Using template auto-escaping (default in Django)
    from django.template import Template, Context
    template = Template("<html><body><p>Results for: {{ query }}</p></body></html>")
    return HttpResponse(template.render(Context({'query': query})))