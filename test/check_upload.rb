require 'digest'

original = '/Users/snyderj/Downloads/test_wmv.wmv'
uploaded = '/tmp/cognizen/test_wmv.wmv'

original_size = File.size(original)
uploaded_size = File.size(uploaded)

original_hash = Digest::SHA1.file(original).hexdigest
uploaded_hash = Digest::SHA1.file(uploaded).hexdigest

puts "Original: Size->#{original_size}, Hash->#{original_hash}"
puts "Uploaded: Size->#{uploaded_size}, Hash->#{uploaded_hash}"
