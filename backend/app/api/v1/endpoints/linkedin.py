from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.core.security.state_store import state_store

router = APIRouter()


@router.get("/auth", summary="Initiate LinkedIn OAuth flow")
async def linkedin_auth():
    """Start the LinkedIn OAuth process."""
    # Generate and store state parameter for CSRF protection
    state = state_store.generate_state()
    
    # Build LinkedIn authorization URL
    auth_url = (
        f"https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={settings.LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={settings.LINKEDIN_REDIRECT_URI}"
        f"&state={state}"
        f"&scope=r_liteprofile%20r_emailaddress%20w_member_social"  # Added w_member_social for broader access
        f"&prompt=consent"  # Always show consent screen
    )
    
    return RedirectResponse(url=auth_url)


from fastapi.responses import RedirectResponse

@router.get("/callback", summary="Handle LinkedIn OAuth callback")
async def linkedin_callback(
    code: str, 
    state: str,
    error: str = None,
    error_description: str = None
):
    """Handle the OAuth callback from LinkedIn."""
    # Check for OAuth errors
    if error:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/error?message={error_description or 'Authentication failed'}"
        )

    # Validate state parameter
    if not state_store.validate_state(state):
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/error?message=Invalid state parameter"
        )
    
    # Log successful authentication
    print(f"Successfully authenticated with LinkedIn. Received auth code: {code[:5]}...")
    
    # TODO: Exchange code for access token
    # TODO: Fetch user profile
    
    # Redirect back to the frontend with success
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/editor?code={code}"
    )
