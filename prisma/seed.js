import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// List of all 195 UN countries, grouped by Continent/Region, with flag emojis and representative cuisine profiles
const countryProfiles = [
  // --- ASIA (35 countries mapped) ---
  { country: "Japan", region: "Asia", cuisine: "Japanese", flag: "🇯🇵", flavors: ["Soy", "Mirin", "Miso", "Dashi", "Wasabi"], starch: "Sushi Rice" },
  { country: "India", region: "Asia", cuisine: "Indian", flag: "🇮🇳", flavors: ["Garam Masala", "Curry", "Cumin", "Turmeric", "Ginger"], starch: "Basmati Rice" },
  { country: "China", region: "Asia", cuisine: "Chinese", flag: "🇨🇳", flavors: ["Soy Sauce", "Ginger", "Garlic", "Sesame Oil", "Five Spice"], starch: "Noodles" },
  { country: "South Korea", region: "Asia", cuisine: "Korean", flag: "🇰🇷", flavors: ["Gochujang", "Kimchi", "Sesame", "Garlic", "Gochugaru"], starch: "White Rice" },
  { country: "Thailand", region: "Asia", cuisine: "Thai", flag: "🇹🇭", flavors: ["Coconut Milk", "Lemongrass", "Fish Sauce", "Lime", "Chili"], starch: "Jasmine Rice" },
  { country: "Vietnam", region: "Asia", cuisine: "Vietnamese", flag: "🇻🇳", flavors: ["Fish Sauce", "Mint", "Cilantro", "Lime", "Star Anise"], starch: "Rice Noodles" },
  { country: "Indonesia", region: "Asia", cuisine: "Indonesian", flag: "🇮🇩", flavors: ["Kecap Manis", "Peanut Sauce", "Shallots", "Galangal", "Lemongrass"], starch: "Nasi" },
  { country: "Philippines", region: "Asia", cuisine: "Filipino", flag: "🇵🇭", flavors: ["Vinegar", "Soy Sauce", "Garlic", "Bay Leaf", "Black Pepper"], starch: "Steamed Rice" },
  { country: "Malaysia", region: "Asia", cuisine: "Malaysian", flag: "🇲🇾", flavors: ["Sambal", "Coconut Milk", "Tamarind", "Turmeric", "Lemon"], starch: "Roti Canai" },
  { country: "Singapore", region: "Asia", cuisine: "Singaporean", flag: "🇸🇬", flavors: ["Chili Paste", "Laksa Leaf", "Coconut", "Curry Powder"], starch: "Hokkien Noodles" },
  { country: "Pakistan", region: "Asia", cuisine: "Pakistani", flag: "🇵🇰", flavors: ["Garam Masala", "Chili", "Coriander", "Yogurt", "Garlic"], starch: "Naan" },
  { country: "Bangladesh", region: "Asia", cuisine: "Bangladeshi", flag: "🇧🇩", flavors: ["Mustard Oil", "Panch Phoron", "Turmeric", "Chili"], starch: "Aman Rice" },
  { country: "Sri Lanka", region: "Asia", cuisine: "Sri Lankan", flag: "🇱🇰", flavors: ["Coconut Milk", "Cardamom", "Curry Leaves", "Chili"], starch: "Red Rice" },
  { country: "Nepal", region: "Asia", cuisine: "Nepalese", flag: "🇳🇵", flavors: ["Ginger", "Garlic", "Coriander", "Cumin", "Sichuan Pepper"], starch: "Momo" },
  { country: "Myanmar", region: "Asia", cuisine: "Burmese", flag: "🇲🇲", flavors: ["Fish Paste", "Turmeric", "Tamarind", "Garlic", "Shallots"], starch: "Mohinga Rice" },
  { country: "Cambodia", region: "Asia", cuisine: "Cambodian", flag: "🇰🇭", flavors: ["Kroeung Paste", "Coconut Milk", "Fish Sauce", "Prahok"], starch: "Rice" },
  { country: "Laos", region: "Asia", cuisine: "Laotian", flag: "🇱🇦", flavors: ["Padaek", "Lime Juice", "Chili", "Mint", "Galangal"], starch: "Sticky Rice" },
  { country: "Mongolia", region: "Asia", cuisine: "Mongolian", flag: "🇲🇳", flavors: ["Salt", "Wild Onion", "Garlic", "Mutton Broth"], starch: "Buuz Flour" },
  { country: "Taiwan", region: "Asia", cuisine: "Taiwanese", flag: "🇹🇼", flavors: ["Soy Sauce", "Five Spice", "Basil", "Ginger", "Rice Wine"], starch: "Minced Rice" },
  { country: "Brunei", region: "Asia", cuisine: "Bruneian", flag: "🇧🇳", flavors: ["Sambal", "Coconut", "Pandan", "Lemongrass"], starch: "Ambuyat" },
  { country: "Bhutan", region: "Asia", cuisine: "Bhutanese", flag: "🇧🇹", flavors: ["Datshi Cheese", "Chili", "Garlic", "Sichuan Pepper"], starch: "Red Rice" },
  { country: "Maldives", region: "Asia", cuisine: "Maldivian", flag: "🇲🇻", flavors: ["Tuna", "Coconut", "Onion", "Chili", "Curry Leaves"], starch: "Roshi" },
  { country: "North Korea", region: "Asia", cuisine: "Korean", flag: "🇰🇵", flavors: ["Cold Broth", "Sesame Oil", "Garlic", "Mild Kimchi"], starch: "Cold Buckwheat Noodles" },
  { country: "East Timor", region: "Asia", cuisine: "Timorese", flag: "🇹🇱", flavors: ["Tamarind", "Chili", "Garlic", "Coconut Oil"], starch: "Cassava" },
  { country: "Kazakhstan", region: "Asia", cuisine: "Central Asian", flag: "🇰🇿", flavors: ["Cumin", "Black Pepper", "Garlic", "Sour Cream"], starch: "Beshbarmak Noodles" },
  { country: "Uzbekistan", region: "Asia", cuisine: "Central Asian", flag: "🇺🇿", flavors: ["Cumin", "Coriander", "Garlic", "Lamb Fat"], starch: "Plöv Rice" },
  { country: "Kyrgyzstan", region: "Asia", cuisine: "Central Asian", flag: "🇰🇬", flavors: ["Black Pepper", "Onion", "Lamb Broth"], starch: "Boorsok" },
  { country: "Tajikistan", region: "Asia", cuisine: "Central Asian", flag: "🇹🇯", flavors: ["Dill", "Parsley", "Cumin", "Kurut Yogurt"], starch: "Qurutob Bread" },
  { country: "Turkmenistan", region: "Asia", cuisine: "Central Asian", flag: "🇹🇲", flavors: ["Black Pepper", "Onion", "Sesame Seed"], starch: "Chorek Bread" },
  { country: "Afghanistan", region: "Asia", cuisine: "Afghan", flag: "🇦🇫", flavors: ["Saffron", "Cardamom", "Coriander", "Cumin", "Dill"], starch: "Kabuli Palaw Rice" },
  { country: "Armenia", region: "Asia", cuisine: "Armenian", flag: "🇦🇲", flavors: ["Pomegranate", "Tarragon", "Mint", "Garlic", "Coriander"], starch: "Lavash" },
  { country: "Georgia", region: "Asia", cuisine: "Georgian", flag: "🇬🇪", flavors: ["Khmeli Suneli", "Coriander", "Garlic", "Walnut Paste", "Cheese"], starch: "Khachapuri Bread" },
  { country: "Azerbaijan", region: "Asia", cuisine: "Azerbaijani", flag: "🇦🇿", flavors: ["Saffron", "Sumac", "Mint", "Dill", "Pomegranate"], starch: "Plöv Rice" },
  { country: "Cyprus", region: "Asia", cuisine: "Cypriot", flag: "🇨🇾", flavors: ["Mint", "Lemon", "Garlic", "Oregano", "Halloumi"], starch: "Pita" },
  { country: "Siberia (Russia)", region: "Asia", cuisine: "Siberian", flag: "🇷🇺", flavors: ["Dill", "Wild Mushrooms", "Berry Reduction", "Sour Cream"], starch: "Pelmeni Flour" },

  // --- MIDDLE EAST (12 countries mapped) ---
  { country: "Lebanon", region: "Middle East", cuisine: "Lebanese", flag: "🇱🇧", flavors: ["Lemon", "Garlic", "Mint", "Olive Oil", "Sumac"], starch: "Flatbread" },
  { country: "Turkey", region: "Middle East", cuisine: "Turkish", flag: "🇹🇷", flavors: ["Cumin", "Mint", "Sumac", "Yogurt", "Pul Biber"], starch: "Pide" },
  { country: "Iran", region: "Middle East", cuisine: "Persian", flag: "🇮🇷", flavors: ["Saffron", "Rosewater", "Turmeric", "Dill", "Pomegranate"], starch: "Tahdig Rice" },
  { country: "Saudi Arabia", region: "Middle East", cuisine: "Saudi", flag: "🇸🇦", flavors: ["Cardamom", "Cloves", "Cinnamon", "Saffron", "Black Lime"], starch: "Kabsa Rice" },
  { country: "Egypt", region: "Middle East", cuisine: "Egyptian", flag: "🇪🇬", flavors: ["Cumin", "Coriander", "Garlic", "Lemon", "Tahini"], starch: "Koshary Pasta" },
  { country: "Jordan", region: "Middle East", cuisine: "Jordanian", flag: "🇯🇴", flavors: ["Jameed Yogurt", "Cumin", "Cardamom", "Pine Nuts"], starch: "Mansaf Rice" },
  { country: "Syria", region: "Middle East", cuisine: "Syrian", flag: "🇸🇾", flavors: ["Pomegranate Molasses", "Za'atar", "Mint", "Garlic"], starch: "Bulgur" },
  { country: "Iraq", region: "Middle East", cuisine: "Iraqi", flag: "🇮🇶", flavors: ["Baharat Spice", "Turmeric", "Cardamom", "Garlic"], starch: "Biryani Rice" },
  { country: "Yemen", region: "Middle East", cuisine: "Yemeni", flag: "🇾🇪", flavors: ["Hawaij Spice", "Fenugreek", "Chili", "Garlic"], starch: "Mandi Rice" },
  { country: "Oman", region: "Middle East", cuisine: "Omani", flag: "🇴🇲", flavors: ["Cardamom", "Saffron", "Lime", "Ginger", "Rosewater"], starch: "Shuwa Rice" },
  { country: "Kuwait", region: "Middle East", cuisine: "Kuwaiti", flag: "🇰🇼", flavors: ["Coriander", "Turmeric", "Cardamom", "Loomi"], starch: "Machboos Rice" },
  { country: "United Arab Emirates", region: "Middle East", cuisine: "Emirati", flag: "🇦🇪", flavors: ["Bezar Spice", "Saffron", "Cardamom", "Ghee"], starch: "Al Harees Wheat" },

  // --- EUROPE (45 countries mapped) ---
  { country: "Italy", region: "Europe", cuisine: "Italian", flag: "🇮🇹", flavors: ["Olive Oil", "Garlic", "Basil", "Parmesan", "Oregano"], starch: "Pasta" },
  { country: "France", region: "Europe", cuisine: "French", flag: "🇫🇷", flavors: ["Butter", "Wine", "Thyme", "Rosemary", "Shallots"], starch: "Baguette" },
  { country: "Spain", region: "Europe", cuisine: "Spanish", flag: "🇪🇸", flavors: ["Saffron", "Olive Oil", "Paprika", "Garlic", "Parsley"], starch: "Paella Rice" },
  { country: "Greece", region: "Europe", cuisine: "Greek", flag: "🇬🇷", flavors: ["Feta", "Olive Oil", "Oregano", "Lemon", "Garlic"], starch: "Pita" },
  { country: "Germany", region: "Europe", cuisine: "German", flag: "🇩🇪", flavors: ["Mustard", "Caraway", "Dill", "Vinegar", "Horseradish"], starch: "Potato" },
  { country: "United Kingdom", region: "Europe", cuisine: "British", flag: "🇬🇧", flavors: ["Thyme", "Rosemary", "Sage", "Worcestershire", "Malt Vinegar"], starch: "Chips" },
  { country: "Ireland", region: "Europe", cuisine: "Irish", flag: "🇮🇪", flavors: ["Butter", "Parsley", "Thyme", "Guinness Stout"], starch: "Soda Bread" },
  { country: "Portugal", region: "Europe", cuisine: "Portuguese", flag: "🇵🇹", flavors: ["Piri Piri", "Cilantro", "Garlic", "Bay Leaf", "Lemon"], starch: "Potatoes" },
  { country: "Belgium", region: "Europe", cuisine: "Belgian", flag: "🇧🇪", flavors: ["Beer", "Thyme", "Nutmeg", "Butter", "Mustard"], starch: "Frites" },
  { country: "Netherlands", region: "Europe", cuisine: "Dutch", flag: "🇳🇱", flavors: ["Nutmeg", "Butter", "Mustard", "Bay Leaf"], starch: "Stamppot Potatoes" },
  { country: "Switzerland", region: "Europe", cuisine: "Swiss", flag: "🇨🇭", flavors: ["Gruyere", "Nutmeg", "White Wine", "Garlic"], starch: "Rösti Potatoes" },
  { country: "Austria", region: "Europe", cuisine: "Austrian", flag: "🇦🇹", flavors: ["Parsley", "Lemon", "Lard", "Breadcrumbs"], starch: "Spaetzle" },
  { country: "Sweden", region: "Europe", cuisine: "Swedish", flag: "🇸🇪", flavors: ["Dill", "Allspice", "Cardamom", "Lingonberry"], starch: "Potatoes" },
  { country: "Norway", region: "Europe", cuisine: "Norwegian", flag: "🇳🇴", flavors: ["Dill", "Juniper Berry", "Sour Cream", "Butter"], starch: "Lefse Flatbread" },
  { country: "Denmark", region: "Europe", cuisine: "Danish", flag: "🇩🇰", flavors: ["Dill", "Caraway", "Butter", "Mustard"], starch: "Rye Bread" },
  { country: "Finland", region: "Europe", cuisine: "Finnish", flag: "🇫🇮", flavors: ["Allspice", "Dill", "Rye", "Butter"], starch: "Rye Pastry" },
  { country: "Iceland", region: "Europe", cuisine: "Icelandic", flag: "🇮🇸", flavors: ["Dill", "Skyr Yogurt", "Angelica Root"], starch: "Rye Bread" },
  { country: "Poland", region: "Europe", cuisine: "Polish", flag: "🇵🇱", flavors: ["Dill", "Marjoram", "Sour Cream", "Wild Mushroom"], starch: "Pierogi" },
  { country: "Czech Republic", region: "Europe", cuisine: "Czech", flag: "🇨🇿", flavors: ["Caraway", "Paprika", "Marjoram", "Garlic"], starch: "Bread Dumplings" },
  { country: "Slovakia", region: "Europe", cuisine: "Slovak", flag: "🇸🇰", flavors: ["Sheep Cheese", "Bacon", "Paprika", "Garlic"], starch: "Potato Halusky" },
  { country: "Hungary", region: "Europe", cuisine: "Hungarian", flag: "🇭🇺", flavors: ["Paprika", "Lard", "Onion", "Garlic", "Sour Cream"], starch: "Nokedli Dumplings" },
  { country: "Romania", region: "Europe", cuisine: "Romanian", flag: "🇷🇴", flavors: ["Sour Cream", "Garlic", "Dill", "Lovage"], starch: "Mamaliga Polenta" },
  { country: "Bulgaria", region: "Europe", cuisine: "Bulgarian", flag: "🇧🇬", flavors: ["Savory", "Paprika", "Garlic", "Yogurt", "Sirene Cheese"], starch: "Banitsa" },
  { country: "Ukraine", region: "Europe", cuisine: "Ukrainian", flag: "🇺🇦", flavors: ["Dill", "Garlic", "Sour Cream", "Beetroot"], starch: "Varenyky" },
  { country: "Russia", region: "Europe", cuisine: "Russian", flag: "🇷🇺", flavors: ["Dill", "Mustard", "Horseradish", "Sour Cream"], starch: "Buckwheat Kasha" },
  { country: "Belarus", region: "Europe", cuisine: "Belarusian", flag: "🇧🇾", flavors: ["Dill", "Sour Cream", "Forest Mushrooms"], starch: "Draniki Potatoes" },
  { country: "Lithuania", region: "Europe", cuisine: "Baltic", flag: "🇱🇹", flavors: ["Dill", "Sour Cream", "Caraway"], starch: "Cepelinai Potatoes" },
  { country: "Latvia", region: "Europe", cuisine: "Baltic", flag: "🇱🇻", flavors: ["Dill", "Caraway", "Sour Cream", "Grey Peas"], starch: "Rye Bread" },
  { country: "Estonia", region: "Europe", cuisine: "Baltic", flag: "🇪🇪", flavors: ["Dill", "Butter", "Sour Cream"], starch: "Barley Bread" },
  { country: "Croatia", region: "Europe", cuisine: "Balkan", flag: "🇭🇷", flavors: ["Olive Oil", "Garlic", "Rosemary", "Parsley"], starch: "Polenta" },
  { country: "Serbia", region: "Europe", cuisine: "Balkan", flag: "🇷🇸", flavors: ["Paprika", "Garlic", "Ajvar Pepper", "Kajmak Cream"], starch: "Pita" },
  { country: "Bosnia and Herzegovina", region: "Europe", cuisine: "Balkan", flag: "🇧🇦", flavors: ["Garlic", "Black Pepper", "Sour Cream"], starch: "Burek Pastry" },
  { country: "Slovenia", region: "Europe", cuisine: "Slovenian", flag: "🇸🇮", flavors: ["Garlic", "Parsley", "Sour Cream", "Forest Herbs"], starch: "Dumplings" },
  { country: "Macedonia", region: "Europe", cuisine: "Balkan", flag: "🇲🇰", flavors: ["Paprika", "Mint", "Garlic", "Sirene"], starch: "Tavce Gravce" },
  { country: "Albania", region: "Europe", cuisine: "Albanian", flag: "🇦🇱", flavors: ["Mint", "Oregano", "Garlic", "Yogurt"], starch: "Flija Bread" },
  { country: "Montenegro", region: "Europe", cuisine: "Balkan", flag: "🇲🇪", flavors: ["Garlic", "Olive Oil", "Rosemary", "Kastradina"], starch: "Kachamak" },
  { country: "Malta", region: "Europe", cuisine: "Maltese", flag: "🇲🇹", flavors: ["Tomato Paste", "Garlic", "Mint", "Fennel"], starch: "Pastizzi" },
  { country: "Luxembourg", region: "Europe", cuisine: "Luxembourgish", flag: "🇱🇺", flavors: ["Riesling Wine", "Butter", "Parsley", "Mustard"], starch: "Potato Pancakes" },
  { country: "Andorra", region: "Europe", cuisine: "Catalan", flag: "🇦🇩", flavors: ["Garlic", "Olive Oil", "Rosemary", "Thyme"], starch: "Trinxat Potatoes" },
  { country: "Monaco", region: "Europe", cuisine: "French-Italian", flag: "🇲🇨", flavors: ["Olive Oil", "Garlic", "Basil", "Pine Nuts"], starch: "Barbagiuan" },
  { country: "San Marino", region: "Europe", cuisine: "Italian", flag: "🇸🇲", flavors: ["Cheese", "Olive Oil", "Garlic", "Rosemary"], starch: "Piadina" },
  { country: "Liechtenstein", region: "Europe", cuisine: "Alpine", flag: "🇱🇮", flavors: ["Cheese", "Butter", "Onion", "Nutmeg"], starch: "Käsknöpfle" },
  { country: "Vatican City", region: "Europe", cuisine: "Roman", flag: "🇻🇦", flavors: ["Pecorino Cheese", "Black Pepper", "Guanciale"], starch: "Rigatoni" },
  { country: "Moldova", region: "Europe", cuisine: "Moldovan", flag: "🇲🇩", flavors: ["Sour Cream", "Dill", "Garlic", "Paprika"], starch: "Mamaliga" },
  { country: "Kosovo", region: "Europe", cuisine: "Balkan", flag: "🇽🇰", flavors: ["Yogurt", "Garlic", "Paprika", "Mint"], starch: "Flija" },

  // --- AFRICA (54 countries mapped) ---
  { country: "Ethiopia", region: "Africa", cuisine: "Ethiopian", flag: "🇪🇹", flavors: ["Berbere", "Niter Kibbeh", "Garlic", "Ginger", "Cardamom"], starch: "Injera" },
  { country: "Morocco", region: "Africa", cuisine: "Moroccan", flag: "🇲🇦", flavors: ["Ras el Hanout", "Cumin", "Preserved Lemon", "Olives", "Ginger"], starch: "Couscous" },
  { country: "Nigeria", region: "Africa", cuisine: "Nigerian", flag: "🇳🇬", flavors: ["Palm Oil", "Crayfish", "Scotch Bonnet", "Locust Beans", "Maggi"], starch: "Fufu" },
  { country: "Egypt", region: "Africa", cuisine: "Egyptian", flag: "🇪🇬", flavors: ["Cumin", "Coriander", "Garlic", "Lemon", "Tahini"], starch: "Koshary" },
  { country: "South Africa", region: "Africa", cuisine: "South African", flag: "🇿🇦", flavors: ["Curry", "Coriander", "Apricot Jam", "Vinegar", "Turmeric"], starch: "Pap" },
  { country: "Senegal", region: "Africa", cuisine: "Senegalese", flag: "🇸🇳", flavors: ["Tamarind", "Habanero", "Tomato Paste", "Lemon", "Fish Paste"], starch: "Broken Rice" },
  { country: "Ghana", region: "Africa", cuisine: "Ghanaian", flag: "🇬🇭", flavors: ["Ginger", "Garlic", "Chili", "Palm Oil", "Tomato"], starch: "Banku" },
  { country: "Kenya", region: "Africa", cuisine: "East African", flag: "🇰🇪", flavors: ["Coconut", "Ginger", "Garlic", "Coriander"], starch: "Ugali" },
  { country: "Tanzania", region: "Africa", cuisine: "East African", flag: "🇹🇿", flavors: ["Coconut Milk", "Cardamom", "Cloves", "Turmeric"], starch: "Ugali" },
  { country: "Uganda", region: "Africa", cuisine: "East African", flag: "🇺🇬", flavors: ["Peanut Paste", "Ginger", "Garlic", "Curry Powder"], starch: "Matooke Plantains" },
  { country: "Algeria", region: "Africa", cuisine: "Algerian", flag: "🇩🇿", flavors: ["Cumin", "Coriander", "Cinnamon", "Mint"], starch: "Couscous" },
  { country: "Tunisia", region: "Africa", cuisine: "Tunisian", flag: "🇹🇳", flavors: ["Harissa", "Cumin", "Coriander", "Olive Oil", "Mint"], starch: "Couscous" },
  { country: "Libya", region: "Africa", cuisine: "Libyan", flag: "🇱🇾", flavors: ["Bzar Spice", "Chili", "Turmeric", "Cinnamon"], starch: "Bazeen Barley" },
  { country: "Sudan", region: "Africa", cuisine: "Sudanese", flag: "🇸🇩", flavors: ["Peanut Butter", "Garlic", "Cumin", "Coridander"], starch: "Kisra Flatbread" },
  { country: "Cote d'Ivoire", region: "Africa", cuisine: "West African", flag: "🇨🇮", flavors: ["Palm Oil", "Chili", "Ginger", "Garlic"], starch: "Attieke" },
  { country: "Cameroon", region: "Africa", cuisine: "Central African", flag: "🇨🇲", flavors: ["Njansang", "Pèbè", "Ginger", "Garlic", "Habanero"], starch: "Ndole Cocoyam" },
  { country: "Angola", region: "Africa", cuisine: "Angolan", flag: "🇦🇴", flavors: ["Palm Oil", "Garlic", "Chili", "Lemon Juice"], starch: "Funje Cassava" },
  { country: "Mozambique", region: "Africa", cuisine: "Mozambican", flag: "🇲🇿", flavors: ["Piri Piri", "Coconut Milk", "Garlic", "Lemon"], starch: "Xima Cornmeal" },
  { country: "Madagascar", region: "Africa", cuisine: "Malagasy", flag: "🇲🇬", flavors: ["Ginger", "Garlic", "Vanilla Bean", "Green Peppercorns"], starch: "Vary Rice" },
  { country: "Zimbabwe", region: "Africa", cuisine: "Southern African", flag: "🇿🇼", flavors: ["Peanut Butter", "Salt", "Garlic"], starch: "Sadza Cornmeal" },
  { country: "Zambia", region: "Africa", cuisine: "Southern African", flag: "🇿🇲", flavors: ["Tomato", "Onion", "Chili", "Peanut"], starch: "Nshima" },
  { country: "Malawi", region: "Africa", cuisine: "Southern African", flag: "🇲🇼", flavors: ["Tomato", "Onion", "Salt", "Chili"], starch: "Nsima" },
  { country: "Namibia", region: "Africa", cuisine: "Southern African", flag: "🇳🇦", flavors: ["Garlic", "Black Pepper", "Rosemary"], starch: "Oshifima" },
  { country: "Botswana", region: "Africa", cuisine: "Southern African", flag: "🇧🇼", flavors: ["Salt", "Bay Leaf", "Onion"], starch: "Seswaa Maize" },
  { country: "Lesotho", region: "Africa", cuisine: "Southern African", flag: "🇱🇸", flavors: ["Butter", "Salt", "Garlic"], starch: "Pap" },
  { country: "Eswatini", region: "Africa", cuisine: "Southern African", flag: "🇸🇿", flavors: ["Ginger", "Garlic", "Chili", "Lemon"], starch: "Sishwala" },
  { country: "Mauritius", region: "Africa", cuisine: "Creole", flag: "🇲🇺", flavors: ["Thyme", "Garlic", "Ginger", "Curry", "Coriander"], starch: "Dhal Puri" },
  { country: "Seychelles", region: "Africa", cuisine: "Creole", flag: "🇸🇨", flavors: ["Coconut Oil", "Chili", "Ginger", "Garlic", "Curry"], starch: "Sweet Potato" },
  { country: "Comoros", region: "Africa", cuisine: "East African", flag: "🇰🇲", flavors: ["Cloves", "Vanilla", "Coconut Milk", "Cardamom"], starch: "Cassava" },
  { country: "Cape Verde", region: "Africa", cuisine: "Creole", flag: "🇨🇻", flavors: ["Bay Leaf", "Garlic", "Onion", "Olive Oil"], starch: "Cachupa Hominy" },
  { country: "Sao Tome and Principe", region: "Africa", cuisine: "Creole", flag: "🇸🇹", flavors: ["Palm Oil", "Bay Leaf", "Garlic", "Chili"], starch: "Banana" },
  { country: "Equatorial Guinea", region: "Africa", cuisine: "Central African", flag: "🇬🇶", flavors: ["Palm Oil", "Peanuts", "Chili", "Garlic"], starch: "Cassava" },
  { country: "Gabon", region: "Africa", cuisine: "Central African", flag: "🇬🇦", flavors: ["Palm Oil", "Ginger", "Garlic", "Peanuts"], starch: "Fufu" },
  { country: "Republic of the Congo", region: "Africa", cuisine: "Central African", flag: "🇨🇬", flavors: ["Moambe Palm", "Chili", "Ginger", "Garlic"], starch: "Fufu" },
  { country: "Democratic Republic of the Congo", region: "Africa", cuisine: "Central African", flag: "🇨🇩", flavors: ["Moambe Palm", "Habanero", "Garlic", "Ginger"], starch: "Chikwangue" },
  { country: "Central African Republic", region: "Africa", cuisine: "Central African", flag: "🇨🇫", flavors: ["Kanda Groundnuts", "Chili", "Garlic"], starch: "Gozo Cassava" },
  { country: "Chad", region: "Africa", cuisine: "Sahelian", flag: "🇹🇩", flavors: ["Cardamom", "Cloves", "Garlic", "Coriander"], starch: "Boule Millet" },
  { country: "Niger", region: "Africa", cuisine: "Sahelian", flag: "🇳🇪", flavors: ["Peanut Powder", "Ginger", "Garlic", "Chili"], starch: "Millet" },
  { country: "Mali", region: "Africa", cuisine: "West African", flag: "🇲🇱", flavors: ["Peanut Sauce", "Tamarind", "Ginger", "Garlic"], starch: "Toh Millet" },
  { country: "Burkina Faso", region: "Africa", cuisine: "West African", flag: "🇧🇫", flavors: ["Soumbala", "Chili", "Ginger", "Garlic"], starch: "Tô" },
  { country: "Mauritania", region: "Africa", cuisine: "North African", flag: "🇲🇷", flavors: ["Mint", "Cumin", "Coriander", "Ginger"], starch: "Couscous" },
  { country: "Somalia", region: "Africa", cuisine: "Somali", flag: "🇸🇴", flavors: ["Xawaash Spice", "Coriander", "Cumin", "Cardamom", "Garlic"], starch: "Bariis Rice" },
  { country: "Djibouti", region: "Africa", cuisine: "East African", flag: "🇩🇯", flavors: ["Berbere", "Garlic", "Ginger", "Cinnamon"], starch: "Laxox Flatbread" },
  { country: "Eritrea", region: "Africa", cuisine: "Eritrean", flag: "🇪🇷", flavors: ["Berbere", "Niter Kibbeh", "Garlic", "Ginger"], starch: "Injera" },
  { country: "Rwanda", region: "Africa", cuisine: "East African", flag: "🇷🇼", flavors: ["Tomato", "Onion", "Salt", "Chili"], starch: "Isombe Cassava Leaves" },
  { country: "Burundi", region: "Africa", cuisine: "East African", flag: "🇧🇮", flavors: ["Red Beans", "Onion", "Garlic", "Salt"], starch: "Ibiharage Plantains" },
  { country: "Liberia", region: "Africa", cuisine: "West African", flag: "🇱🇷", flavors: ["Palava Sauce", "Scotch Bonnet", "Garlic", "Ginger"], starch: "Rice" },
  { country: "Sierra Leone", region: "Africa", cuisine: "West African", flag: "🇸🇱", flavors: ["Cassava Leaves", "Palm Oil", "Crayfish", "Habanero"], starch: "Rice" },
  { country: "Guinea", region: "Africa", cuisine: "West African", flag: "🇬🇳", flavors: ["Peanut Butter", "Garlic", "Ginger", "Chili"], starch: "Rice" },
  { country: "Guinea-Bissau", region: "Africa", cuisine: "West African", flag: "🇬🇼", flavors: ["Palm Oil", "Lemon", "Garlic", "Ginger"], starch: "Rice" },
  { country: "Gambia", region: "Africa", cuisine: "West African", flag: "🇬🇲", flavors: ["Domoda Peanuts", "Lemon", "Chili", "Garlic"], starch: "Rice" },
  { country: "Togo", region: "Africa", cuisine: "West African", flag: "🇹🇬", flavors: ["Gboma", "Ginger", "Garlic", "Habanero"], starch: "Akume Maize" },
  { country: "Benin", region: "Africa", cuisine: "West African", flag: "🇧🇯", flavors: ["Palm Oil", "Ginger", "Garlic", "Chili"], starch: "Pounded Yam" },
  { country: "South Sudan", region: "Africa", cuisine: "East African", flag: "🇸🇸", flavors: ["Peanut Paste", "Okra", "Garlic", "Coriander"], starch: "Asida" },

  // --- AMERICAS (35 countries mapped) ---
  { country: "Mexico", region: "Americas", cuisine: "Mexican", flag: "🇲🇽", flavors: ["Lime", "Cilantro", "Chili", "Cumin", "Garlic"], starch: "Corn Tortilla" },
  { country: "United States", region: "Americas", cuisine: "American", flag: "🇺🇸", flavors: ["BBQ Sauce", "Garlic Powder", "Paprika", "Black Pepper"], starch: "Fries" },
  { country: "Canada", region: "Americas", cuisine: "Canadian", flag: "🇨🇦", flavors: ["Maple Syrup", "Thyme", "Sage", "Cheese Curds"], starch: "Poutine Fries" },
  { country: "Brazil", region: "Americas", cuisine: "Brazilian", flag: "🇧🇷", flavors: ["Dendê Palm Oil", "Garlic", "Lime", "Bay Leaf", "Coriander"], starch: "Cassava Flour" },
  { country: "Argentina", region: "Americas", cuisine: "Argentinian", flag: "🇦🇷", flavors: ["Chimichurri", "Garlic", "Parsley", "Oregano", "Vinegar"], starch: "Empanada Shell" },
  { country: "Peru", region: "Americas", cuisine: "Peruvian", flag: "🇵🇪", flavors: ["Ají Amarillo", "Lime Juice", "Cilantro", "Red Onion", "Ginger"], starch: "Potatoes" },
  { country: "Colombia", region: "Americas", cuisine: "Colombian", flag: "🇨🇴", flavors: ["Cilantro", "Scallions", "Garlic", "Cumin"], starch: "Arepa" },
  { country: "Venezuela", region: "Americas", cuisine: "Venezuelan", flag: "🇻🇪", flavors: ["Garlic", "Cilantro", "Bell Pepper", "Cumin"], starch: "Arepa" },
  { country: "Chile", region: "Americas", cuisine: "Chilean", flag: "🇨🇱", flavors: ["Merken Chili", "Garlic", "Onion", "Oregano"], starch: "Pastel de Choclo" },
  { country: "Ecuador", region: "Americas", cuisine: "Ecuadorian", flag: "🇪🇨", flavors: ["Achiote", "Lime", "Cilantro", "Garlic"], starch: "Plantain" },
  { country: "Bolivia", region: "Americas", cuisine: "Bolivian", flag: "🇧🇴", flavors: ["Ají Panca", "Cumin", "Garlic", "Cilantro"], starch: "Quinoa" },
  { country: "Paraguay", region: "Americas", cuisine: "Paraguayan", flag: "🇵🇾", flavors: ["Aniseed", "Cheese", "Butter", "Onion"], starch: "Sopa Paraguaya" },
  { country: "Uruguay", region: "Americas", cuisine: "Uruguayan", flag: "🇺🇾", flavors: ["Garlic", "Parsley", "Oregano", "Chimichurri"], starch: "Chivito Bread" },
  { country: "Cuba", region: "Americas", cuisine: "Cuban", flag: "🇨🇺", flavors: ["Mojo Sour Orange", "Garlic", "Oregano", "Cumin"], starch: "Rice and Beans" },
  { country: "Dominican Republic", region: "Americas", cuisine: "Dominican", flag: "🇩🇴", flavors: ["Soprito", "Garlic", "Oregano", "Cilantro"], starch: "Mofongo Plantains" },
  { country: "Haiti", region: "Americas", cuisine: "Haitian", flag: "🇭🇹", flavors: ["Epis Seasoning", "Thyme", "Garlic", "Scotch Bonnet"], starch: "Diri ak Djon Djon" },
  { country: "Jamaica", region: "Americas", cuisine: "Jamaican", flag: "🇯🇲", flavors: ["Jerk Spice", "Allspice", "Thyme", "Scotch Bonnet", "Ginger"], starch: "Rice & Peas" },
  { country: "Bahamas", region: "Americas", cuisine: "Bahamian", flag: "🇧🇸", flavors: ["Lime", "Thyme", "Hot Sauce", "Coconut"], starch: "Pigeon Peas" },
  { country: "Trinidad and Tobago", region: "Americas", cuisine: "Trinidadian", flag: "🇹🇹", flavors: ["Curry", "Chado Beni", "Garlic", "Ginger", "Chili"], starch: "Roti" },
  { country: "Guyana", region: "Americas", cuisine: "Guyanese", flag: "🇬🇾", flavors: ["Cassareep", "Cinnamon", "Thyme", "Wiri Wiri Pepper"], starch: "Roti" },
  { country: "Suriname", region: "Americas", cuisine: "Surinamese", flag: "🇸🇷", flavors: ["Masala Curry", "Ginger", "Garlic", "Madiya Sauce"], starch: "Roti" },
  { country: "Costa Rica", region: "Americas", cuisine: "Costa Rican", flag: "🇨🇷", flavors: ["Lizano Sauce", "Cilantro", "Bell Pepper", "Garlic"], starch: "Gallo Pinto" },
  { country: "Panama", region: "Americas", cuisine: "Panamanian", flag: "🇵🇦", flavors: ["Culantro", "Garlic", "Onion", "Oregano"], starch: "Arroz con Pollo" },
  { country: "Nicaragua", region: "Americas", cuisine: "Nicaraguan", flag: "🇳🇮", flavors: ["Garlic", "Achiote", "Lime", "Sour Orange"], starch: "Gallo Pinto" },
  { country: "Honduras", region: "Americas", cuisine: "Honduran", flag: "🇭🇳", flavors: ["Coconut Oil", "Cumin", "Garlic", "Cilantro"], starch: "Baleada Tortilla" },
  { country: "El Salvador", region: "Americas", cuisine: "Salvadoran", flag: "🇸🇻", flavors: ["Loroco", "Curtido", "Tomato Sauce", "Garlic"], starch: "Pupusa" },
  { country: "Guatemala", region: "Americas", cuisine: "Guatemalan", flag: "🇬🇹", flavors: ["Pepian Spice", "Cilantro", "Sesame Seed", "Pumpkin Seed"], starch: "Corn Tamal" },
  { country: "Belize", region: "Americas", cuisine: "Belizean", flag: "🇧🇿", flavors: ["Recado Rojo", "Coconut Milk", "Thyme", "Habanero"], starch: "Rice and Beans" },
  { country: "Barbados", region: "Americas", cuisine: "Bajan", flag: "🇧🇧", flavors: ["Bajan Seasoning", "Thyme", "Marjoram", "Scotch Bonnet"], starch: "Cou-Cou Cornmeal" },
  { country: "Saint Lucia", region: "Americas", cuisine: "Caribbean", flag: "🇱🇨", flavors: ["Garlic", "Thyme", "Ginger", "Allspice"], starch: "Green Fig Green Banana" },
  { country: "Saint Vincent and the Grenadines", region: "Americas", cuisine: "Caribbean", flag: "🇻🇨", flavors: ["Thyme", "Garlic", "Onion", "Chili"], starch: "Breadfruit" },
  { country: "Grenada", region: "Americas", cuisine: "Caribbean", flag: "🇬🇩", flavors: ["Nutmeg", "Coconut Milk", "Turmeric", "Thyme"], starch: "Oil Down Dumplings" },
  { country: "Antigua and Barbuda", region: "Americas", cuisine: "Caribbean", flag: "🇦🇬", flavors: ["Thyme", "Garlic", "Scotch Bonnet"], starch: "Fungi Cornmeal" },
  { country: "Saint Kitts and Nevis", region: "Americas", cuisine: "Caribbean", flag: "🇰🇳", flavors: ["Thyme", "Garlic", "Ginger"], starch: "Breadfruit" },
  { country: "Dominica", region: "Americas", cuisine: "Caribbean", flag: "🇩🇲", flavors: ["Thyme", "Garlic", "Scotch Bonnet"], starch: "Dasheen" },

  // --- OCEANIA (14 countries mapped) ---
  { country: "Australia", region: "Oceania", cuisine: "Australian", flag: "🇦🇺", flavors: ["Lemon Myrtle", "Wattleseed", "Vegemite", "BBQ Smoke"], starch: "Meat Pie Crust" },
  { country: "New Zealand", region: "Oceania", cuisine: "Maori / Kiwi", flag: "🇳🇿", flavors: ["Manuka Honey", "Rosemary", "Garlic", "Kiwi Fruit"], starch: "Kumara Sweet Potato" },
  { country: "Fiji", region: "Oceania", cuisine: "Fijian", flag: "🇫🇯", flavors: ["Coconut Cream", "Lime", "Chili", "Ginger"], starch: "Taro Root" },
  { country: "Papua New Guinea", region: "Oceania", cuisine: "Melanesian", flag: "🇵🇬", flavors: ["Coconut Cream", "Salt", "Ginger"], starch: "Sago" },
  { country: "Samoa", region: "Oceania", cuisine: "Polynesian", flag: "🇼🇸", flavors: ["Coconut Cream", "Onion", "Salt"], starch: "Taro" },
  { country: "Tonga", region: "Oceania", cuisine: "Polynesian", flag: "🇹🇴", flavors: ["Coconut Cream", "Onion", "Chili"], starch: "Lu Sweet Potato" },
  { country: "Vanuatu", region: "Oceania", cuisine: "Melanesian", flag: "🇻🇺", flavors: ["Coconut Cream", "Salt", "Wild Ginger"], starch: "Laplap Yam" },
  { country: "Solomon Islands", region: "Oceania", cuisine: "Melanesian", flag: "🇸🇧", flavors: ["Coconut", "Salt", "Ginger"], starch: "Taro" },
  { country: "Micronesia", region: "Oceania", cuisine: "Micronesian", flag: "🇫🇲", flavors: ["Coconut Milk", "Soy Sauce", "Ginger"], starch: "Breadfruit" },
  { country: "Marshall Islands", region: "Oceania", cuisine: "Micronesian", flag: "🇲🇭", flavors: ["Coconut Cream", "Pandanus", "Sweet Potato"], starch: "Tapioca" },
  { country: "Palau", region: "Oceania", cuisine: "Micronesian", flag: "🇵🇼", flavors: ["Coconut Milk", "Ginger", "Garlic"], starch: "Taro" },
  { country: "Kiribati", region: "Oceania", cuisine: "Polynesian", flag: "🇰🇮", flavors: ["Coconut", "Tuna", "Lime"], starch: "Pandanus Rice" },
  { country: "Tuvalu", region: "Oceania", cuisine: "Polynesian", flag: "🇹🇻", flavors: ["Coconut Cream", "Fish", "Taro Leaf"], starch: "Pulaka" },
  { country: "Nauru", region: "Oceania", cuisine: "Micronesian", flag: "🇳🇷", flavors: ["Coconut Cream", "Lime Juice", "Pandan"], starch: "Taro" },
];

const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "DESSERT", "DRINK"];
const difficulties = ["EASY", "MEDIUM", "HARD", "CHEF"];

const recipeAdjectives = ["Classic", "Spicy", "Authentic", "Traditional", "Savory", "Herbed", "Sweet", "Slow-Cooked", "Smoked", "Garlic", "Glazed", "Crispy", "Roasted", "Zesty"];
const dishNames = [
  { name: "Stew", mealType: "DINNER", calories: 450 },
  { name: "Rice Bowl", mealType: "LUNCH", calories: 550 },
  { name: "Soup", mealType: "LUNCH", calories: 300 },
  { name: "Curry", mealType: "DINNER", calories: 600 },
  { name: "Skillet", mealType: "DINNER", calories: 500 },
  { name: "Salad", mealType: "LUNCH", calories: 250 },
  { name: "Flatbread", mealType: "SNACK", calories: 350 },
  { name: "Fritters", mealType: "SNACK", calories: 400 },
  { name: "Stir-Fry", mealType: "LUNCH", calories: 480 },
  { name: "Porridge", mealType: "BREAKFAST", calories: 320 },
  { name: "Pancakes", mealType: "BREAKFAST", calories: 380 },
  { name: "Pastry", mealType: "DESSERT", calories: 410 },
  { name: "Pudding", mealType: "DESSERT", calories: 290 },
  { name: "Herbal Infusion", mealType: "DRINK", calories: 50 },
];

const proteins = ["Chicken", "Beef", "Pork", "Lamb", "Salmon", "Tofu", "Lentils", "Chickpeas", "Shrimp", "Duck", "Cod", "Goat", "Mixed Beans", "Eggplant"];
const veggies = ["Bell Peppers", "Onions", "Carrots", "Garlic", "Spinach", "Tomatoes", "Mushrooms", "Broccoli", "Bok Choy", "Zucchini", "Cabbage", "Ginger"];

// Image templates from Unsplash to ensure premium visual looks
const unsplashFoodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", // Bowl
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38", // Pizza/flatbread
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445", // Pancake/breakfast
  "https://images.unsplash.com/photo-1484723091739-30a097e8f929", // Toast
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd", // Salad
  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601", // Pasta
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836", // Steak/Platter
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352", // Vegetables
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327", // Seafood
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", // BBQ
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061", // Healthy bowl
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187", // Cake/Dessert
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe", // Platter
  "https://images.unsplash.com/photo-1565557623262-b51c2513a641", // Indian curry
  "https://images.unsplash.com/photo-1512058564366-18510be2db19", // Stir fry
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0", // Breakfast skillet
  "https://images.unsplash.com/photo-1551024601-bec78aea704b", // Donuts/dessert
  "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd", // Drink/cocktail
  "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2", // Asian food
  "https://images.unsplash.com/photo-1506084868230-bb9d95c24759", // Oatmeal
];

const dietaryTags = ["Vegan", "Vegetarian", "Gluten-Free", "Halal", "Kosher", "Jain", "Keto", "Dairy-Free", "Nut-Free"];
const methodTags = ["Grill", "Bake", "Fry", "Steam", "Slow-Cook", "Raw", "Sauté"];

async function main() {
  console.log("Starting seed script...");

  // 1. Clean existing data
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE users, recipes, ingredients, instructions, tags, recipe_tags, reviews, cookbooks, cookbook_recipes, saved_recipes, browse_history, cuisines CASCADE;`);
  console.log("Database cleaned.");

  // 2. Create standard roles and seed users
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash("Password123!", salt);

  const admin = await prisma.user.create({
    data: {
      name: "Atlas Admin",
      email: "admin@flavoratlas.com",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      bio: "Chief Culinary Officer at FlavorAtlas.",
      country: "Global",
      dietaryPreferences: []
    }
  });

  const moderator = await prisma.user.create({
    data: {
      name: "Chef Mod",
      email: "mod@flavoratlas.com",
      passwordHash,
      role: "MODERATOR",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      bio: "Food editor & recipe reviewer.",
      country: "France",
      dietaryPreferences: []
    }
  });

  // Regular seed users who will submit recipes and reviews
  const users = [];
  const usernames = [
    { name: "Elena Rostova", email: "elena@example.com", country: "Russia", prefs: ["Vegetarian"] },
    { name: "Raj Patel", email: "raj@example.com", country: "India", prefs: ["Vegetarian", "Gluten-Free"] },
    { name: "Carlos Santana", email: "carlos@example.com", country: "Mexico", prefs: ["Halal"] },
    { name: "Yuki Tanaka", email: "yuki@example.com", country: "Japan", prefs: [] },
    { name: "Fatima Al-Sud", email: "fatima@example.com", country: "Egypt", prefs: ["Halal"] },
    { name: "Chloe Smith", email: "chloe@example.com", country: "Australia", prefs: ["Keto"] },
    { name: "Kwame Mensah", email: "kwame@example.com", country: "Ghana", prefs: [] }
  ];

  for (const u of usernames) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: "USER",
        isVerified: true,
        avatarUrl: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1438761681033-6461ffad8d80' : '1507003211169-0a1dd7228f2d'}?w=100`,
        bio: `Passionate foodie from ${u.country}. Love exploring world flavors!`,
        country: u.country,
        dietaryPreferences: u.prefs
      }
    });
    users.push(user);
  }
  console.log(`Created ${users.length + 2} seed users.`);

  // 3. Create Cuisines (unique lists)
  const cuisinesMap = new Map();
  const distinctCuisines = Array.from(new Set(countryProfiles.map(p => p.cuisine)));

  for (const cName of distinctCuisines) {
    // Find first country matching this cuisine to fetch description and region
    const profile = countryProfiles.find(p => p.cuisine === cName);
    const cuisine = await prisma.cuisine.create({
      data: {
        name: cName,
        region: profile.region,
        country: profile.country,
        flagEmoji: profile.flag,
        description: `Delightful traditional recipes highlighting ${cName} culinary history, flavors, and techniques.`
      }
    });
    cuisinesMap.set(cName, cuisine);
  }
  console.log(`Created ${cuisinesMap.size} distinct cuisine categories.`);

  // 4. Create Tags
  const allTags = [];
  const createdTagsMap = new Map();

  for (const tag of dietaryTags) {
    const t = await prisma.tag.create({
      data: { name: tag, slug: tag.toLowerCase(), category: "dietary" }
    });
    allTags.push(t);
    createdTagsMap.set(tag, t);
  }
  for (const tag of methodTags) {
    const t = await prisma.tag.create({
      data: { name: tag, slug: tag.toLowerCase(), category: "method" }
    });
    allTags.push(t);
    createdTagsMap.set(tag, t);
  }
  console.log("Seeded dietary and method tags.");

  // 5. Generate 2000+ Recipes (distributed over 186 country-cuisine profiles)
  // To reach exactly 2000+ recipes, let's generate around 11 recipes per country profile (186 * 11 = 2046 recipes)
  // Let's loop through countryProfiles.
  console.log("Generating 2,050 recipes... This may take a moment.");

  let recipeCounter = 0;
  const BATCH_SIZE = 100;
  let batchRecipes = [];

  for (let i = 0; i < countryProfiles.length; i++) {
    const profile = countryProfiles[i];
    const recipesPerCountry = 11; // 186 * 11 = 2046

    for (let rIdx = 0; rIdx < recipesPerCountry; rIdx++) {
      recipeCounter++;
      const author = users[recipeCounter % users.length];

      // Pick a random dish name structure
      const dishObj = dishNames[(recipeCounter + rIdx) % dishNames.length];
      const adj = recipeAdjectives[(recipeCounter * rIdx) % recipeAdjectives.length];
      const protein = proteins[(recipeCounter + rIdx) % proteins.length];
      const title = `${adj} ${profile.country} ${protein} ${dishObj.name}`;

      const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${recipeCounter}`;
      const prepTime = 10 + (recipeCounter % 4) * 5; // 10, 15, 20, 25 mins
      const cookTime = 15 + (recipeCounter % 6) * 10; // 15, 25, 35, 45, 55, 65 mins
      const difficulty = difficulties[recipeCounter % difficulties.length];
      const servings = 2 + (recipeCounter % 6); // 2 to 8 servings
      const calories = dishObj.calories + (recipeCounter % 15) * 10;
      const status = recipeCounter < 15 ? "PENDING" : "APPROVED"; // Seed 15 pending recipes for approval queue

      // Cover image
      const coverUrl = unsplashFoodImages[recipeCounter % unsplashFoodImages.length] + `?auto=format&fit=crop&w=800&q=80&sig=${recipeCounter}`;

      const flavorsString = profile.flavors.join(", ");
      const description = `This ${title} is a delicious ${profile.cuisine} delicacy originating from ${profile.country}. Cooked with fine touches of ${flavorsString}, it brings absolute culinary warmth to your plate. Enjoy it hot with family and friends.`;

      // Ingredients setup
      const ingredientsData = [
        { name: protein, quantity: 400.0, unit: "g", isOptional: false, sortOrder: 1 },
        { name: profile.starch, quantity: 200.0, unit: "g", isOptional: false, sortOrder: 2 },
        { name: veggies[recipeCounter % veggies.length], quantity: 150.0, unit: "g", isOptional: false, sortOrder: 3 },
        { name: veggies[(recipeCounter + 1) % veggies.length], quantity: 1.0, unit: "cup", isOptional: true, sortOrder: 4 },
        { name: profile.flavors[0], quantity: 2.0, unit: "tbsp", isOptional: false, sortOrder: 5 },
        { name: profile.flavors[1] || "Garlic", quantity: 1.0, unit: "tsp", isOptional: true, sortOrder: 6 }
      ];

      // Instructions setup
      const instructionsData = [
        { stepNumber: 1, description: `Prepare the main ingredients: chop the ${protein.toLowerCase()} and wash the ${veggies[recipeCounter % veggies.length].toLowerCase()}.` },
        { stepNumber: 2, description: `Sauté the garlic, ginger, and base seasonings in a preheated pan using traditional ${profile.cuisine} methods.` },
        { stepNumber: 3, description: `Add the ${protein.toLowerCase()} and cook thoroughly until tender and slightly golden brown.` },
        { stepNumber: 4, description: `Stir in the ${profile.flavors[0].toLowerCase()} and simmer alongside ${veggies[(recipeCounter + 1) % veggies.length].toLowerCase()} for 10-15 minutes.` },
        { stepNumber: 5, description: `Serve the steaming hot ${title} immediately over freshly prepared ${profile.starch}. Garnish with chopped herbs.` }
      ];

      // Tags setup (link to 1 dietary and 1 method tag)
      const dietaryChoice = dietaryTags[recipeCounter % dietaryTags.length];
      const methodChoice = methodTags[recipeCounter % methodTags.length];

      // We will perform the create in nested Prisma syntax.
      // Since we want to insert 2000+ items quickly, we can push them directly
      batchRecipes.push({
        title,
        slug,
        description,
        originCountry: profile.country,
        cuisineType: profile.cuisine,
        mealType: dishObj.mealType,
        difficulty,
        prepTimeMins: prepTime,
        cookTimeMins: cookTime,
        servings,
        caloriesPerServing: calories,
        coverImageUrl: coverUrl,
        videoUrl: recipeCounter % 3 === 0 ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : null,
        youtubeSearchQuery: `${title} ${profile.cuisine} recipe how to make`,
        status,
        viewCount: 10 + (recipeCounter % 200),
        saveCount: 2 + (recipeCounter % 50),
        authorId: author.id,
        ingredients: { create: ingredientsData },
        instructions: { create: instructionsData },
        tags: {
          create: [
            { tag: { connect: { name: dietaryChoice } } },
            { tag: { connect: { name: methodChoice } } }
          ]
        },
        reviews: recipeCounter % 5 === 0 ? {
          create: [
            {
              userId: users[(recipeCounter + 1) % users.length].id,
              rating: 4 + (recipeCounter % 2), // 4 or 5 stars
              comment: `Absolutely loved this! The combination of ${flavorsString} was perfect. Highly recommend making this traditional ${profile.cuisine} dish!`
            }
          ]
        } : undefined
      });

      if (batchRecipes.length >= BATCH_SIZE || (i === countryProfiles.length - 1 && rIdx === recipesPerCountry - 1)) {
        // Run nested inserts sequentially to preserve relations
        for (const recipeInput of batchRecipes) {
          await prisma.recipe.create({
            data: recipeInput
          });
        }
        console.log(`Seeded ${recipeCounter} recipes...`);
        batchRecipes = [];
      }
    }
  }

  // 6. Pre-seed Cookbooks
  const user1 = users[0];
  const user2 = users[1];

  const approvedRecipes = await prisma.recipe.findMany({
    where: { status: "APPROVED" },
    take: 10
  });

  const cb1 = await prisma.cookbook.create({
    data: {
      userId: user1.id,
      name: "My Favorite Asian Dishes",
      description: "A collections of delicious recipes from East and South Asia.",
      isPublic: true,
      recipes: {
        create: approvedRecipes.slice(0, 3).map(r => ({
          recipeId: r.id
        }))
      }
    }
  });

  const cb2 = await prisma.cookbook.create({
    data: {
      userId: user2.id,
      name: "Quick Midweek Dinners",
      description: "Healthy and simple meals under 30 minutes.",
      isPublic: false,
      recipes: {
        create: approvedRecipes.slice(3, 6).map(r => ({
          recipeId: r.id
        }))
      }
    }
  });

  // Save recipe bookmarks
  await prisma.savedRecipe.createMany({
    data: [
      { userId: user1.id, recipeId: approvedRecipes[0].id },
      { userId: user1.id, recipeId: approvedRecipes[1].id },
      { userId: user2.id, recipeId: approvedRecipes[2].id }
    ]
  });

  // Saved Browse History
  await prisma.browseHistory.createMany({
    data: [
      { userId: user1.id, recipeId: approvedRecipes[0].id },
      { userId: user1.id, recipeId: approvedRecipes[2].id },
      { userId: user2.id, recipeId: approvedRecipes[4].id }
    ]
  });

  console.log("Cookbooks and saved recipe bookmark links seeded successfully.");
  console.log("Database seeding completed successfully! Total Recipes Seeded:", recipeCounter);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
