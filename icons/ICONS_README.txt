ICON FILES NEEDED
=================

The extension requires three PNG icon files in this folder:

1. icon16.png  (16x16 pixels)
2. icon48.png  (48x48 pixels)
3. icon128.png (128x128 pixels)

HOW TO CREATE ICONS:
--------------------

Option 1: Use an online icon generator
- Visit: https://www.favicon-generator.org/
- Upload any image
- Download the generated icons
- Rename them to match the required names above

Option 2: Use existing images
- Find any PNG image
- Resize it to 16x16, 48x48, and 128x128 using an image editor
- Save as the required filenames

Option 3: Use a simple colored square (for testing)
- Open any image editor (Paint, Photoshop, GIMP, etc.)
- Create a 128x128 purple square
- Save as icon128.png
- Resize to 48x48 and save as icon48.png
- Resize to 16x16 and save as icon16.png

TEMPORARY WORKAROUND:
---------------------

If you want to test the extension immediately without icons:
1. Remove the "icons" section from manifest.json
2. Remove the "default_icon" section from the "action" in manifest.json
3. The extension will work but won't have an icon in the toolbar

The extension will still function perfectly without icons,
but Chrome will show a default placeholder icon instead.
