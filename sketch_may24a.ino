// ===== CONFIGURAÇÃO DE HARDWARE =====
// Pinos analógicos para sensores de umidade (escalável para 3+)
#define SENSOR_1_PIN A0
#define SENSOR_2_PIN A1
#define SENSOR_3_PIN A2

// LEDs para feedback visual (Sensor 1)
#define LED_RED_PIN   13  // Vermelho → Seco     (DRY)
#define LED_GREEN_PIN 8   // Verde    → Moderado (MODERATE)
#define LED_BLUE_PIN  7   // Azul     → Úmido   (WET)

// Controle de irrigação
#define IRRIGATION_RELAY_PIN 12  // Saída para relé de bomba

// ===== CONFIGURAÇÃO DE LIMIARES =====
// Mapeamento de valores: 0-800 úmido, 800-900 moderado, 900-1023 seco
#define THRESHOLD_WET_DRY 800
#define THRESHOLD_MODERATE_DRY 900

// ===== ESTRUTURA DE DADOS =====
struct SensorConfig {
  uint8_t pinNumber;
  const char* sensorName;
  int lastReading;
  const char* lastStatus;
};

// Array de sensores
SensorConfig sensors[3] = {
  {A0, "SENSOR_1", 0, "unknown"},
  {A1, "SENSOR_2", 0, "unknown"},
  {A2, "SENSOR_3", 0, "unknown"}
};

// Estado do sistema
bool irrigationActive = false;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 500; // 500ms entre leituras (comportamento próximo ao original)

// Buffer para comandos Serial
char commandBuffer[64];
uint8_t commandBufferIndex = 0;

// ===== SETUP =====
void setup() {
  Serial.begin(9600);
  
  // Configurar pinos de entrada
  pinMode(SENSOR_1_PIN, INPUT);
  pinMode(SENSOR_2_PIN, INPUT);
  pinMode(SENSOR_3_PIN, INPUT);
  
  // Configurar pinos de saída (LEDs)
  pinMode(LED_BLUE_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  
  // Configurar pino de irrigação
  pinMode(IRRIGATION_RELAY_PIN, OUTPUT);
  digitalWrite(IRRIGATION_RELAY_PIN, LOW); // Desativado por padrão
  
  // Apagar todos os LEDs
  turnOffAllLEDs();
  
  // Mensagem de inicialização
  Serial.println("INIT:success");
  delay(500);
}

// ===== LOOP PRINCIPAL =====
void loop() {
  // Processar comandos Serial recebidos
  processSerialCommands();
  
  // Ler sensores a cada READ_INTERVAL
  if (millis() - lastReadTime >= READ_INTERVAL) {
    lastReadTime = millis();
    readAllSensors();
  }
}

// ===== LEITURA DE SENSORES =====
void readAllSensors() {
  for (uint8_t i = 0; i < 3; i++) {
    int rawValue = analogRead(sensors[i].pinNumber);
    sensors[i].lastReading = rawValue;
    
    // Classificar status
    const char* status = classifyMoisture(rawValue);
    sensors[i].lastStatus = status;
    
    // Feedback visual para Sensor 1 (LEDs)
    if (i == 0) {
      updateLEDs(status);
    }
    
    // Enviar dados formatados para o backend
    // Formato: SENSOR:ID:value:status:timestamp
    sendSensorData(sensors[i].sensorName, rawValue, status, millis());
  }
}

// ===== CLASSIFICAÇÃO DE UMIDADE =====
const char* classifyMoisture(int value) {
  if (value < THRESHOLD_WET_DRY) {
    return "WET";
  } else if (value < THRESHOLD_MODERATE_DRY) {
    return "MODERATE";
  } else {
    return "DRY";
  }
}

// ===== ENVIO DE DADOS =====
void sendSensorData(const char* sensorName, int value, const char* status, unsigned long timestamp) {
  // Formato: SENSOR:SENSOR_1:450:WET:12345678
  Serial.print("SENSOR:");
  Serial.print(sensorName);
  Serial.print(":");
  Serial.print(value);
  Serial.print(":");
  Serial.print(status);
  Serial.print(":");
  Serial.println(timestamp);
}

// ===== PROCESSAMENTO DE COMANDOS SERIAL =====
void processSerialCommands() {
  while (Serial.available() > 0) {
    char incomingChar = Serial.read();
    
    // Usar '\n' como delimitador
    if (incomingChar == '\n') {
      commandBuffer[commandBufferIndex] = '\0';
      executeCommand(commandBuffer);
      commandBufferIndex = 0;
    } else if (incomingChar == '\r') {
      // Ignorar carriage return
      continue;
    } else if (commandBufferIndex < sizeof(commandBuffer) - 1) {
      commandBuffer[commandBufferIndex++] = incomingChar;
    }
  }
}

// ===== EXECUÇÃO DE COMANDOS =====
void executeCommand(const char* cmd) {
  // Formato esperado: CMD:irrigation:ON/OFF
  // ou: CONFIG:threshold_wet_dry:800
  
  if (strncmp(cmd, "CMD:irrigation:", 15) == 0) {
    handleIrrigationCommand(&cmd[15]);
  } 
  else if (strncmp(cmd, "PING", 4) == 0) {
    Serial.println("PONG");
  }
  else if (strncmp(cmd, "STATUS", 6) == 0) {
    printSystemStatus();
  }
  else {
    Serial.println("ERROR:unknown_command");
  }
}

// ===== CONTROLE DE IRRIGAÇÃO =====
void handleIrrigationCommand(const char* action) {
  if (strcmp(action, "ON") == 0) {
    irrigationActive = true;
    digitalWrite(IRRIGATION_RELAY_PIN, HIGH);
    Serial.println("ACK:irrigation:ON");
  } 
  else if (strcmp(action, "OFF") == 0) {
    irrigationActive = false;
    digitalWrite(IRRIGATION_RELAY_PIN, LOW);
    Serial.println("ACK:irrigation:OFF");
  }
  else {
    Serial.println("ERROR:invalid_irrigation_action");
  }
}

// ===== CONTROLE DE LEDs =====
void updateLEDs(const char* status) {
  turnOffAllLEDs();
  
  if (strcmp(status, "WET") == 0) {
    digitalWrite(LED_BLUE_PIN, HIGH);   // Azul → Úmido
  }
  else if (strcmp(status, "MODERATE") == 0) {
    digitalWrite(LED_GREEN_PIN, HIGH);  // Verde → Moderado
  }
  else if (strcmp(status, "DRY") == 0) {
    digitalWrite(LED_RED_PIN, HIGH);    // Vermelho → Seco
  }
}

void turnOffAllLEDs() {
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_BLUE_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, LOW);
}

// ===== STATUS DO SISTEMA =====
void printSystemStatus() {
  Serial.println("=== SYSTEM STATUS ===");
  for (uint8_t i = 0; i < 3; i++) {
    Serial.print(sensors[i].sensorName);
    Serial.print(": ");
    Serial.print(sensors[i].lastReading);
    Serial.print(" (");
    Serial.print(sensors[i].lastStatus);
    Serial.println(")");
  }
  Serial.print("Irrigation: ");
  Serial.println(irrigationActive ? "ON" : "OFF");
  Serial.println("===================");
}