import os
import time
import subprocess

def paste_text(text_file):
    # Copy text to clipboard
    # Securely set environment and pass file contents to pbcopy
    my_env = os.environ.copy()
    my_env["LANG"] = "en_US.UTF-8"
    with open(text_file, 'rb') as f:
        subprocess.run(["pbcopy"], stdin=f, env=my_env)
    # Trigger Cmd+V
    script = '''
    tell application "System Events"
        keystroke "v" using command down
    end tell
    '''
    subprocess.run(["osascript", "-e", script])

def paste_image(image_path):
    # Copy image to clipboard securely using arguments
    script_copy = '''on run argv
    set the clipboard to (read (POSIX file (item 1 of argv)) as JPEG picture)
end run'''
    subprocess.run(["osascript", "-e", script_copy, "--", image_path])
    # Trigger Cmd+V
    script_paste = '''
    tell application "System Events"
        keystroke "v" using command down
    end tell
    '''
    subprocess.run(["osascript", "-e", script_paste])

if __name__ == "__main__":
    print("Waiting 5 seconds for you to click inside the editor...")
    time.sleep(5)
    
    print("Pasting text...")
    paste_text("/Users/jirnyak/Mirror/gigahrush/PRCampaign/dtf_casual_post_draft_2026-07-02.md")
    
    time.sleep(1)
    
    # Send Enter key to make a new line
    subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
    time.sleep(0.5)
    
    print("Pasting image 1...")
    paste_image("/Users/jirnyak/Mirror/gigahrush/screenshots/promo/gamepush_premium/screenshots_landscape/screenshot_2.jpg")
    
    time.sleep(1.5)
    
    # Send Enter key to make a new line
    subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
    time.sleep(0.5)
    
    print("Pasting image 2...")
    paste_image("/Users/jirnyak/Mirror/gigahrush/screenshots/promo/gamepush_premium/screenshots_landscape/screenshot_4.jpg")
    
    print("Done!")
