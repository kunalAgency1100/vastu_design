<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax',
]);
if (!@session_start()) {
    respond(503, ['ok' => false, 'message' => 'We couldn’t send your enquiry at the moment. Please try again later.']);
}

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'GET') {
    respond(200, ['csrf_token' => $_SESSION['csrf_token']]);
}
if ($method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['ok' => false, 'message' => 'This request could not be processed.']);
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    respond(415, ['ok' => false, 'message' => 'This request could not be processed.']);
}
$raw = file_get_contents('php://input', false, null, 0, 16001);
if ($raw === false || strlen($raw) > 16000) {
    respond(413, ['ok' => false, 'message' => 'Please shorten your message and try again.']);
}
$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, ['ok' => false, 'message' => 'Please check your enquiry and try again.']);
}
$token = isset($data['csrf_token']) && is_string($data['csrf_token']) ? $data['csrf_token'] : '';
if (!hash_equals($_SESSION['csrf_token'], $token)) {
    respond(403, ['ok' => false, 'message' => 'Please refresh this page and try again.']);
}

function field(array $data, string $key): string {
    return isset($data[$key]) && is_string($data[$key]) ? trim($data[$key]) : '';
}
function textLength(string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

if (field($data, 'website') !== '') {
    respond(422, ['ok' => false, 'message' => 'Please check your enquiry and try again.']);
}
$name = field($data, 'name');
$email = field($data, 'email');
$phone = field($data, 'phone');
$service = field($data, 'service');
$message = field($data, 'message');
$allowedServices = ['General enquiry', 'Property selection', 'Full home consultation', 'Additions and renovations', 'Pre-sale reviews', 'Living spaces', 'Commercial spaces', 'Development project'];

if (textLength($name) < 2 || textLength($name) > 100 || preg_match('/[\r\n]/', $name) ||
    strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email) ||
    textLength($phone) > 30 || ($phone !== '' && !preg_match('/^[+0-9().\s-]{7,30}$/', $phone)) ||
    textLength($message) < 10 || textLength($message) > 3000 ||
    !in_array($service, $allowedServices, true) || field($data, 'consent') !== 'yes') {
    respond(422, ['ok' => false, 'message' => 'Please check the fields in your enquiry and try again.']);
}

$recent = array_filter($_SESSION['enquiry_attempts'] ?? [], function ($time) { return is_int($time) && $time > time() - 3600; });
if (count($recent) >= 5) {
    header('Retry-After: 3600');
    respond(429, ['ok' => false, 'message' => 'Please wait a little while before sending another enquiry.']);
}
$recent[] = time();
$_SESSION['enquiry_attempts'] = array_values($recent);

$config = require __DIR__ . '/contact-config.php';
$recipient = (string) ($config['recipient_email'] ?? '');
$sender = (string) ($config['sender_email'] ?? '');
if (!filter_var($recipient, FILTER_VALIDATE_EMAIL) || !filter_var($sender, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $recipient . $sender)) {
    respond(503, ['ok' => false, 'message' => 'We couldn’t send your enquiry at the moment. Please try again later.']);
}

$subject = 'Vastu Design enquiry — ' . $service;
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$body = "New Vastu Design enquiry\n\nName: {$name}\nEmail: {$email}\nPhone: " . ($phone !== '' ? $phone : 'Not supplied') . "\nService: {$service}\n\nMessage:\n{$message}\n\nConsent: agreed to be contacted about this enquiry.\n";
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: Vastu Design <' . $sender . '>',
    'Reply-To: ' . $email,
];
session_write_close();

if (!function_exists('mail') || !@mail($recipient, $encodedSubject, $body, implode("\r\n", $headers))) {
    respond(503, ['ok' => false, 'message' => 'We couldn’t send your enquiry at the moment. Please try again later.']);
}
respond(200, ['ok' => true, 'message' => 'Thank you. Your enquiry has been sent to Vastu Design.']);
