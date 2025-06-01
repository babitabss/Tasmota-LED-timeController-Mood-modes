const client = mqtt.connect('ws://broker.emqx.io:8083/mqtt');
const statusDiv = document.getElementById('status');
const device = 'babita';

client.on('connect', () => {
  statusDiv.textContent = 'Connected to MQTT broker';
  statusDiv.className = 'text-green-600 font-medium text-center';
});

client.on('error', err => {
  statusDiv.textContent = `Error: ${err.message}`;
  statusDiv.className = 'text-red-600 font-medium text-center';
});

document.getElementById('powerBtn').addEventListener('click', () => {
  const topic = `cmnd/${device}/Power`;
  client.publish(topic, 'TOGGLE', {}, err => {
    statusDiv.textContent = err ? `Error: ${err.message}` : `Sent TOGGLE command to ${topic}`;
    statusDiv.className = err ? 'text-red-600 text-center' : 'text-green-600 text-center';
  });
});

document.getElementById('setScheduleBtn').addEventListener('click', () => {
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const repeat = document.getElementById('repeatCheckbox').checked ? 1 : 0;
  const days = '1111111';

  // Because your device logic is inverted:
  // Action 0 = OFF → LED ON (visible)
  // Action 1 = ON → LED OFF (invisible)

  const timer1 = JSON.stringify({ 
    Enable: 1, 
    Mode: 0, 
    Time: startTime, 
    Days: days, 
    Repeat: repeat, 
    Output: 1, 
    Action: 0   // OFF command to turn ON light at startTime
  });

  const timer2 = JSON.stringify({ 
    Enable: 1, 
    Mode: 0, 
    Time: endTime, 
    Days: days, 
    Repeat: repeat, 
    Output: 1, 
    Action: 1   // ON command to turn OFF light at endTime
  });

  client.publish(`cmnd/${device}/Timer1`, timer1, {}, (err) => {
    if (err) {
      statusDiv.textContent = `Timer1 error: ${err.message}`;
      statusDiv.className = 'text-red-600 text-center';
      return;
    }
  });

  client.publish(`cmnd/${device}/Timer2`, timer2, {}, (err) => {
    if (err) {
      statusDiv.textContent = `Timer2 error: ${err.message}`;
      statusDiv.className = 'text-red-600 text-center';
      return;
    }
    statusDiv.textContent = `Scheduled: LED ON at ${startTime}, LED OFF at ${endTime}`;
    statusDiv.className = 'text-green-600 text-center';
  });
});


function setMood(mode) {
  if (mode === 'reading') {
    client.publish(`cmnd/${device}/Power`, 'OFF'); // because ON = OFF
    client.publish(`cmnd/${device}/Dimmer`, '100');
    statusDiv.textContent = 'Reading Mode Activated: Light ON';
  } else if (mode === 'party') {
    client.publish(`cmnd/${device}/BlinkCount`, '50');
    client.publish(`cmnd/${device}/BlinkTime`, '3');
    client.publish(`cmnd/${device}/Power`, 'Blink');

    statusDiv.textContent = 'Party Mode Activated: Blinking Lights';
  } else if (mode === 'relax') {
    client.publish(`cmnd/${device}/Power`, 'OFF'); // Light turns ON

    setTimeout(() => {
      client.publish(`cmnd/${device}/Dimmer`, '30'); // Dim to 30%
    }, 500);
    statusDiv.textContent = 'Relax Mode Activated: Dimmed Light';
  } else if (mode === 'off') {
    client.publish(`cmnd/${device}/Rule1`, 'OFF');
    client.publish(`cmnd/${device}/Power`, 'ON'); // turns light OFF
    statusDiv.textContent = 'Mood Turned Off';
  }
  statusDiv.className = 'text-purple-600 text-center';
}
