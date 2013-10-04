require 'watir-webdriver'

$browser = Watir::Browser.start 'https://localhost:9443'

def login
  $browser.text_field(id: 'username').set 'snyderj@ctc.com'
  $browser.text_field(id: 'pass').set '123'
  $browser.div(id: 'loginSubmit').click

  $browser.div(id: 'projListHeader').wait_until_present # Check for the project list
end

def add_program(program_name)
  $browser.div(id: 'adminAddProgram').click
  $browser.text_field(id: 'myName').set program_name
  $browser.button(id: 'registerContent-submit').click
  $browser.span(class: 'folder', text: program_name).wait_until_present
end

def close_browser
  $browser.close
end

# Run Tests
login
add_program('program 123')
close_browser


