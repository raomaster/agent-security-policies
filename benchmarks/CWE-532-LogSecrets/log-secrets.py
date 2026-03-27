# Vulnerable: Logging sensitive data
import logging

logger = logging.getLogger(__name__)

def process_payment(card_number, amount):
    # Vulnerable: credit card number logged
    logger.info(f"Processing payment: card={card_number} amount={amount}")
    charge_card(card_number, amount)

def update_profile(user_id, data):
    # Vulnerable: entire data dict logged (may contain secrets)
    logger.debug(f"Updating user {user_id}: {data}")
    save_profile(user_id, data)
