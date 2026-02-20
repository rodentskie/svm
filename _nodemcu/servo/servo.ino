#include <ESP32Servo.h>

#define SERVO_PIN 32

Servo s;

void setup() {
}

void loop() {
  rotate(SERVO_PIN);
  delay(5000);  // stop for 5 sec
}


void rotate(int pin) {

  if (!s.attached()) s.attach(pin);

  s.write(40);  // rotate
  delay(6000);

  s.detach();
}