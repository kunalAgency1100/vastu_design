<?php
/** Set these two addresses before enabling enquiries on PHP hosting. */
return [
    'recipient_email' => getenv('VASTU_CONTACT_EMAIL') ?: '',
    'sender_email' => getenv('VASTU_FROM_EMAIL') ?: '',
    'site_name' => 'Vastu Design',
];
