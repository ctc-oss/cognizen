require 'watir-webdriver'

# Login
b = Watir::Browser.start 'https://localhost:9443'
b.text_field(id: 'username').set 'snyderj@ctc.com'
b.text_field(id: 'pass').set '123'
b.div(id: 'loginSubmit').click

# Check for the project list
b.div(id: 'projListHeader').wait_until_present

b.div(id: 'adminAddProgram').click
program_name = 'program 3'
b.text_field(id: 'myName').set program_name
b.button(id: 'registerContent-submit').click
b.span(class: 'folder', text: program_name).wait_until_present

b.close