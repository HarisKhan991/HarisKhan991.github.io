# AI Project Generator Prompt

Copy and paste this prompt into ChatGPT/Claude with your project URL or description:

---

You are an AI assistant helping students create project documentation in Instructables style.

[INPUT: Paste YouTube video URL OR website URL OR project description here]

Generate a CSV file with this EXACT structure:
section_order,section_title,section_content,image_url_1,image_url_2,image_url_3,video_url,video_type

Rules:
- Create 5-10 logical step-by-step sections
- Extract relevant images from the source (provide URLs)
- For YouTube videos: extract thumbnail, video ID, chapters if available
- Include "Introduction" and "Conclusion" sections
- Format section_content as plain text (escape quotes with double quotes)
- image_url fields can be empty if no images
- video_url should be YouTube embed URL format (https://youtube.com/embed/VIDEO_ID)
- video_type should be: youtube, vimeo, or local

Example CSV output:
```csv
section_order,section_title,section_content,image_url_1,image_url_2,image_url_3,video_url,video_type
1,Introduction,"This project demonstrates how to build a smart home system using Arduino and IoT sensors. You'll learn about circuit design and programming.",https://example.com/img1.jpg,,,https://youtube.com/embed/abc123,youtube
2,Materials Needed,"Gather these components: Arduino Uno, DHT22 sensor, LED lights, breadboard, jumper wires, power supply.",https://example.com/img2.jpg,https://example.com/img3.jpg,,,
3,Circuit Assembly,"Connect the DHT22 sensor to pin 2, LEDs to pins 9-11, and power connections as shown in the diagram.",https://example.com/circuit.jpg,,,https://youtube.com/embed/step2,youtube
4,Programming,"Upload the provided Arduino code. The code reads temperature/humidity data and controls LEDs based on thresholds.",https://example.com/code.jpg,,,,
5,Testing and Calibration,"Power on the system and verify sensor readings. Adjust LED thresholds as needed for your environment.",https://example.com/testing.jpg,,,,
6,Conclusion,"You now have a functional smart home monitoring system. Extend it by adding more sensors or connecting to the cloud.",https://example.com/final.jpg,,,,
```

After generating, copy the CSV and paste it into the CSV Import tool in StudyHi.

---

## Tips for Better Results:

1. **For YouTube Videos**: Provide the full URL and mention if you want timestamps
2. **For Websites**: Provide the article URL and specify what aspects to focus on
3. **For Custom Projects**: Describe your project in detail, including materials and steps
4. **Image URLs**: If you have your own images, provide their URLs in the prompt

## Example Prompts:

**Example 1 - YouTube Video:**
```
Create project documentation from this YouTube video:
https://www.youtube.com/watch?v=dQw4w9WgXcQ

Focus on the hardware setup and include timestamps as separate sections.
```

**Example 2 - Website:**
```
Create project documentation from this Instructables page:
https://www.instructables.com/Arduino-Weather-Station/

Extract all images and organize into clear step-by-step sections.
```

**Example 3 - Custom Project:**
```
Create documentation for a "LED Cube 8x8x8" project with these materials:
- 512 LEDs
- Arduino Mega
- Shift registers
- Wood base

Include sections for: planning, soldering, programming, and troubleshooting.
```

---

## Importing Your CSV

1. Go to StudyHi Projects → Create → Import from AI/CSV
2. Paste your AI-generated CSV into the text area
3. Click "Parse CSV" to preview sections
4. Review and edit if needed
5. Click "Continue to Editor" to complete your project
