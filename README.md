# Die Gewölbe des Pythagoras – ein Mathe-Roguelike

In diesem Browserspiel kämpfen Schülerinnen und Schüler nicht mit Schwertern, sondern mit Mathematik. Sie wählen ihren Weg durch einen Dungeon. Jeder Gegner wird mit Aufgaben besiegt, der Boss am Ende jeder Ebene ist eine kleine Zwischenprüfung, und analoge Quests verbinden das Spiel mit der Arbeit im Heft.

**Erstes Thema:** Terme & Gleichungen, Jahrgang 7 (Gymnasium Niedersachsen, Doppeljahrgang 7/8). Weitere Themen lassen sich ergänzen (siehe unten).

---

## Schnellstart

1. Den Ordner auf einen Webserver legen (siehe *Bereitstellung*). Auf einem Laptop genügt auch ein Doppelklick auf `index.html`.
2. **Vor dem Einsatz die Lehrer-PIN ändern:** In `js/config.js` steht `lehrerPin: '2468'`.
3. Die Schüler öffnen die Seite auf dem iPad. Tipp: Über „Teilen → Zum Home-Bildschirm“ lässt sich das Spiel wie eine App starten.

## Spielmodi

| Modus | Wofür? | Analoge Quests |
|---|---|---|
| 🏫 **Klassenmodus** | Einsatz im Unterricht | Die Aufgabe wird im Heft bearbeitet und der Lehrkraft vorgelegt. Die Freigabe erfolgt mit PIN und einer Bewertung von 1–3 ⭐. Alternativ kann die Lehrkraft die Quest mit einer Rückmeldung zur Überarbeitung zurückgeben. |
| 🏠 **Übungsmodus** | Nachlernen zu Hause | Selbstkontrolle mit Checkliste und ehrlicher Selbsteinschätzung. Keine Lehrkraft nötig, Ruhemodus wählbar. |
| 🎯 **Trainingsraum** | Gezieltes Üben einzelner Themen | Ohne Lebenspunkte und ohne Zeitdruck, mit Lösungsweg bei Fehlern. |

## Spielstände

Pro Gerät gibt es **drei Spielstände**, z. B. für mehrere Schüler an einem Klassen-iPad oder für Klassen- und Übungsmodus parallel. Ein neues Abenteuer startet nur auf einem freien Platz, ein belegter Spielstand kann also nicht versehentlich überschrieben werden. Gelöscht wird ein Spielstand nur über 🗑️ und eine Bestätigung. Erfahrungspunkte und Lernstand gelten für das ganze Gerät und bleiben beim Löschen erhalten.

## Spielregeln (Kurzfassung)

- **Karte:** Die Schüler wählen ihren Weg selbst. Es gibt ⚔️ Gegner, 💀 Elitegegner, ❓ Ereignisse, 🛒 Händler, 🔥 Rastplätze, 📜 Quests und 👑 Bosse. Jeder Durchgang wird neu zufällig erzeugt.
- **Kampf:**
  - Jede richtige Antwort trifft den Gegner.
  - Eine falsche Antwort kostet 1 ❤️. Danach gibt es einen Tipp und einen zweiten Versuch.
  - Ist auch der zweite Versuch falsch, kostet das noch 1 ❤️, und der **vollständige Lösungsweg** wird angezeigt.
  - Nach jedem gewonnenen Kampf gibt es +1 ❤️.
- **Zeit (moderat):** Wer innerhalb der Zielzeit antwortet, bekommt Bonus-Gold (grüner Balken). Erst wer mehr als die doppelte Zielzeit braucht, verliert 1 ❤️. Die Korrektheit zählt also deutlich mehr als die Geschwindigkeit.
- **Boss = Zwischenprüfung:** 3 Phasen mit steigender Schwierigkeit. Danach folgt eine Kompetenzübersicht zur Ebene mit Ampel (🟢 ab 80 %, 🟡 ab 50 %, 🔴 darunter).
- **Rastplatz → Fehlerwerkstatt:** Eine Aufgabe zu einem Thema, bei dem vorher ein Fehler passiert ist, erneut lösen. Wer es schafft, bekommt +1 maximale Lebenspunkte. Lernen aus Fehlern wird so belohnt.
- **Fortschritt:** Erfahrungspunkte bleiben über Durchgänge hinweg erhalten und schalten neue Charaktere frei (Rechenmagier mit mehr Zeit, Ritter, Händler).

## Freier Dungeon (Standard) und Pfadkarte

- **Freier Dungeon:** Jede Ebene wird zufällig erzeugt, mit 9 bis 10 Räumen, Gängen und Sichtbereich.
  - **Laufen:** Ein Tipp auf ein Feld, dann läuft die Figur den kürzesten Weg dorthin. Alternativ gibt es das Steuerkreuz oder die Pfeiltasten.
  - **Zoom:** mit zwei Fingern oder den Knöpfen ＋/－. Die gewählte Stufe merkt sich das Gerät.
  - **Monster** bewegen sich nur, wenn die Figur einen Schritt macht. Es gibt also keinen Reaktionsdruck, und Zeit zählt nur beim Rechnen.
  - **Boss-Tor:** Es öffnet sich erst, wenn eine Mindestanzahl Monster besiegt ist. Die Zahl stellt die Lehrkraft ein (Standard 5). Nach dem Boss (der Zwischenprüfung) führt eine Treppe zur nächsten Ebene.
  - **Weitere Begegnungen:** Händler 🛒, Lagerfeuer 🔥 (Rastplatz mit Fehlerwerkstatt), Altar ❓ (Ereignis) und Quest-Brett 📜 (analoge Quest) führen zu den bekannten Bildschirmen. Danach geht es an derselben Stelle weiter.
  - **Rätseltür 🚪:** Sie öffnet sich nur mit einer gelösten Aufgabe und versperrt eine Schatzkammer.
  - **Schatzkarte 🗺️:** Sie nennt eine Koordinate, z. B. (15|21). Die Achsen sind am Rand beschriftet: x nach rechts, y nach oben.
- **Pfadkarte:** die bisherige Karte mit Feldern. Sie bleibt als Option im Lehrkraft-Bereich erhalten („Kartenart“).

## Grafik, Animationen und Klänge

- **Karte:** Jede Ebene hat ihre eigene Kulisse:
  - Katakomben mit Fackeln
  - Kristallhöhlen
  - Turm unter dem Sternenhimmel
- **Koordinaten:** Die Felder liegen auf einem Koordinatengitter, jedes Feld trägt seine Koordinate, z. B. (2|1).
- **Nebel:** Nur die nächsten zwei Reihen sind sichtbar.
- **Vorschau:** Der erste Tipp auf ein Feld zeigt eine Vorschau mit Risiko und Belohnung, der zweite Tipp läuft los. Das verhindert Fehlklicks auf dem iPad.
- **Kampfbühne:**
  - Die eingetippte Antwort fliegt als Rune zum Gegner. Schnelle Antworten werden zum kritischen Treffer.
  - Bei Fehlern stürmt der Gegner vor.
  - Den Zeitdruck zeigt der Gegner, indem er sichtbar einen Angriff auflädt (grün → gelb → rot). Im Ruhemodus schläft er.
  - **Während jeder Animation steht die Uhr still.**
- **Bosse:** Auftritt mit Namensbanner, sichtbarer Phasenwechsel, Belohnungstruhe.
- **Simulationen im Lösungsweg:**
  - Waage (Gleichungen, nur bei positiven Zahlen)
  - Flächenmodell (Klammern auflösen und ausklammern)
  - Sortiermaschine (Zusammenfassen)
  - Einsetzmaschine (Termwert)

  Man kann sie Schritt für Schritt oder automatisch ablaufen lassen.
- **Klänge** werden im Browser erzeugt, ohne Sounddateien, und sind standardmäßig aus. Schüler schalten sie im Pause-Menü um, die Lehrkraft im Lehrkraft-Bereich.
- **Weniger Bewegung:** Schaltet Animationen weitgehend ab (Pause-Menü bzw. Lehrkraft-Bereich), z. B. bei Reizempfindlichkeit. Ist auf dem Gerät „Bewegung reduzieren“ eingestellt, gilt das automatisch.

## Eingaben

Die Bildschirmtastatur ist für Tablets gemacht; auf Laptops funktioniert auch die normale Tastatur.

- Terme: `3x+2`, `2(x-1)`, `x²`, `5ab`. **Gleichwertige Schreibweisen werden erkannt**, z. B. `3+2x` statt `2x+3`.
- Bei „Fasse zusammen“ und „Löse die Klammern auf“ muss das Ergebnis vollständig vereinfacht sein. Eine gleichwertige, aber unfertige Eingabe wird nicht als Fehler gezählt, sondern mit dem Hinweis „noch nicht fertig“ beantwortet.
- Beim Ausklammern wird geprüft, ob der **größte** gemeinsame Faktor ausgeklammert wurde.
- Lösungen: `x = 3`, `3`, `1,5`, `3/2` und `L = {3}` sind gleichwertig.
- Tippfehler (z. B. eine offene Klammer) kosten keine Lebenspunkte. Das Spiel meldet sie nur.

## Lehrkraft-Bereich (🔑 auf dem Startbildschirm, PIN nötig)

- **Zeitdruck aus:** Ruhemodus für alle Durchgänge auf diesem Gerät, z. B. als Nachteilsausgleich.
- **Zeitfaktor** 1× / 1,5× / 2×.
- **Schwierigkeit:** Leicht (eine Stufe leichter, erster Fehler ohne Schaden) / Normal / Schwer.
- **Kartenart:** freier Dungeon oder Pfadkarte. **Monster bis zum Boss-Tor:** 3, 4, 5, 6 oder 8.
- **Große Darstellung:** größere Schrift, Tasten und Dungeon-Felder, z. B. bei Sehschwäche.
- **Klänge** an/aus und **Bewegung** normal/reduziert.
- Analoge Quests an/aus, alle Charaktere freischalten, PIN pro Gerät ändern, Lernstand einsehen und Daten löschen.

## Inhalte Jahrgang 7: Terme & Gleichungen

| Ebene | Fähigkeit | prozessbezogener Schwerpunkt | AFB |
|---|---|---|---|
| 1 Katakomben der Terme | Termwerte berechnen | symbolisch/formal/technisch | I |
| | Terme aufstellen (Wortterme, Sachkontexte, Geometrie) | Modellieren | II |
| | Terme zusammenfassen | symbolisch/formal/technisch | I |
| | Produkte vereinfachen | symbolisch/formal/technisch | I |
| 2 Klammerhöhlen | Klammern auflösen (inkl. Minusklammer) | symbolisch/formal/technisch | I–II |
| | Ausklammern | symbolisch/formal/technisch | II |
| | Gleichwertige Terme erkennen (typische Fehlvorstellungen als Distraktoren) | Argumentieren | II |
| 3 Turm der Gleichungen | Lineare Gleichungen lösen | symbolisch/formal/technisch | I–II |
| | Gleichungen mit Klammern | symbolisch/formal/technisch | II |
| | Lösungen prüfen (Probe) | Argumentieren | I |
| | Fehler in Rechnungen finden | Argumentieren | II–III |
| | Sachaufgaben mit Gleichungen | Probleme lösen / Modellieren | II–III |

Jede Fähigkeit hat drei Schwierigkeitsstufen. Alle Aufgaben werden mit Zufallszahlen erzeugt, sodass Abschreiben vom Nachbarn nicht hilft.

Die Zuordnung orientiert sich am Kerncurriculum Mathematik für das Gymnasium (Sek. I) in Niedersachsen, inhaltsbezogener Bereich „Zahlen und Operationen“, Doppeljahrgang 7/8. **Bitte mit dem schuleigenen Arbeitsplan abgleichen.** Je nach Arbeitsplan werden z. B. Klammern oder Gleichungen erst in Jg. 8 behandelt. Dann kann man die Ebenen in `js/topics/jg7-terme-gleichungen.js` umsortieren oder kürzen.

## Eigene analoge Quests

In `js/config.js` unter `eigeneQuests`, zum Beispiel:

```js
{ ebene: 'alle', emoji: '📐', titel: 'Buchaufgabe',
  text: 'Bearbeite S. 42 Nr. 5 im Heft und lege sie deiner Lehrkraft vor.',
  selbst: 'Bearbeite S. 42 Nr. 5 und vergleiche mit den Lösungen im Buch.',
  kontrolle: ['Hast du alle Teilaufgaben bearbeitet?'] }
```

## Datenschutz und Einsatz im Unterricht

- Das Spiel verarbeitet **keine personenbezogenen Daten auf einem Server**: kein Login, keine Cloud, kein Tracking, keine externen Schriften oder Bibliotheken. Spielstände und Lernstand liegen ausschließlich im Browser-Speicher (localStorage) des jeweiligen Geräts und können im Lehrkraft-Bereich gelöscht werden.
- Die Schüler geben nur einen Spitznamen ein (Hinweis im Spiel: nicht den vollständigen Namen).
- Beim Hosten auf einem Webserver protokolliert der Server ggf. IP-Adressen. Ein schuleigener Server ist deshalb vorzuziehen. Bei externen Diensten (z. B. GitHub Pages) bitte vorher Rücksprache mit der/dem schulischen Datenschutzbeauftragten halten.
- **Leistungsbewertung:** Das Spiel ist als Übungs- und Diagnoseinstrument gedacht, also für formative Rückmeldung. Die Spielergebnisse sollten nicht unmittelbar in Noten übersetzt werden. Die Abschlussübersicht und die vorgelegten analogen Quests können aber Grundlage für Gespräche und für Beobachtungen zur Mitarbeit sein. Maßgeblich sind die Vorgaben zur Leistungsbewertung und die Beschlüsse der Fachkonferenz.

## Bereitstellung

Das Spiel besteht nur aus statischen Dateien (HTML, CSS, JavaScript). Es braucht keine Installation und keine Datenbank. Möglich sind:

- **Schulserver / Schulhomepage:** den Ordner hochladen und den Link teilen.
- **GitHub Pages:** In diesem Repository unter *Settings → Pages* den Branch auswählen (Datenschutzhinweis oben beachten).
- **Laptops ohne Internet:** den Ordner kopieren und `index.html` öffnen.

## Neue Themen ergänzen (z. B. Zuordnungen, Prozentrechnung)

1. Eine neue Datei `js/topics/<thema>.js` nach dem Vorbild von `jg7-terme-gleichungen.js` anlegen:
   - pro Fähigkeit eine Funktion `gen(d)` für d = 1…3,
   - die Ebenen mit Gegnern, Boss-Phasen und analogen Quests.
2. Die Datei in `index.html` vor `js/content.js` einbinden.
3. Das neue Thema erscheint automatisch bei „Neues Abenteuer“, im Trainingsraum und im Lernstand.

Bausteine für Aufgaben (`RM.T` in `js/topics/registry.js`):

- `valueTask` für Zahlen und Lösungen,
- `termTask` mit den Prüfmodi `equiv`, `simplified` und `factored`,
- `choiceTask` für Auswahlaufgaben.

## Tests

```bash
node tests/run-tests.js            # Mathe-Kern + 400 Zufallsaufgaben je Fähigkeit und Stufe
node tests/play-test.js 3 [ordner] # spielt 3 komplette Durchgänge im Browser (Playwright)
node tests/slot-test.js            # Spielstände: anlegen, laden, löschen, alte Spielstände übernehmen
# play-test.js spielt abwechselnd einen Durchgang im Dungeon und einen auf der Pfadkarte
```
