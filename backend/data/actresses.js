/**
 * South Indian actress auction deck — prices in INR (IPL-style lakhs/crores)
 */
const IMAGE_FILE = {
  mamithabajju: 'mamithabaiju.jpg',
  nazriya: 'naziriya.jpg',
  kalyanipriyadharshan: 'kalyanipriyadharsan.jpg',
};

function imagePath(slug) {
  const file = IMAGE_FILE[slug] || `${slug}.jpg`;
  return `/actresses/${file}`;
}

const ACTRESS_DEFS = [
  { slug: 'samantha', name: 'Samantha Ruth Prabhu', age: 37, rating: 98, basePrice: 20000000 },
  { slug: 'rashmika', name: 'Rashmika Mandanna', age: 29, rating: 97, basePrice: 19500000 },
  { slug: 'trisha', name: 'Trisha Krishnan', age: 41, rating: 96, basePrice: 19000000 },
  { slug: 'saipallavi', name: 'Sai Pallavi', age: 32, rating: 95, basePrice: 18500000 },
  { slug: 'kajalagarwal', name: 'Kajal Aggarwal', age: 40, rating: 94, basePrice: 18000000 },
  { slug: 'poojahegde', name: 'Pooja Hegde', age: 34, rating: 93, basePrice: 17500000 },
  { slug: 'rakulpreetsingh', name: 'Rakul Preet Singh', age: 34, rating: 92, basePrice: 17000000 },
  { slug: 'sreeleela', name: 'Sreeleela', age: 23, rating: 91, basePrice: 16500000 },
  { slug: 'nazriya', name: 'Nazriya Nazim', age: 29, rating: 90, basePrice: 16000000 },
  { slug: 'mrunalthakur', name: 'Mrunal Thakur', age: 32, rating: 89, basePrice: 15500000 },
  { slug: 'krithishetty', name: 'Krithi Shetty', age: 22, rating: 88, basePrice: 15000000 },
  { slug: 'priyawarrior', name: 'Priya Warrior', age: 27, rating: 86, basePrice: 9500000 },
  { slug: 'asin', name: 'Asin', age: 40, rating: 85, basePrice: 9000000 },
  { slug: 'genelia', name: 'Genelia D\'Souza', age: 37, rating: 84, basePrice: 8800000 },
  { slug: 'amalapaul', name: 'Amala Paul', age: 37, rating: 83, basePrice: 8500000 },
  { slug: 'dishapatani', name: 'Disha Patani', age: 32, rating: 82, basePrice: 8200000 },
  { slug: 'anaswararajan', name: 'Anaswara Rajan', age: 22, rating: 81, basePrice: 8000000 },
  { slug: 'nivethapethuraj', name: 'Nivetha Pethuraj', age: 31, rating: 80, basePrice: 7800000 },
  { slug: 'rashikhanna', name: 'Raashi Khanna', age: 34, rating: 79, basePrice: 7500000 },
  { slug: 'priyaanand', name: 'Priya Anand', age: 38, rating: 78, basePrice: 7200000 },
  { slug: 'kalyanipriyadharshan', name: 'Kalyani Priyadarshan', age: 31, rating: 77, basePrice: 7000000 },
  { slug: 'kayadulohar', name: 'Kayadu Lohar', age: 28, rating: 76, basePrice: 6800000 },
  { slug: 'anuemanuel', name: 'Anu Emmanuel', age: 28, rating: 75, basePrice: 6500000 },
  { slug: 'priyankamohan', name: 'Priyanka Mohan', age: 29, rating: 74, basePrice: 6200000 },
  { slug: 'malavikamohan', name: 'Malavika Mohanan', age: 27, rating: 73, basePrice: 6000000 },
  { slug: 'rukminivasanth', name: 'Rukmini Vasanth', age: 26, rating: 72, basePrice: 5800000 },
  { slug: 'srinithishetty', name: 'Srinidhi Shetty', age: 31, rating: 71, basePrice: 5600000 },
  { slug: 'mamithabajju', name: 'Mamitha Baiju', age: 25, rating: 70, basePrice: 5400000 },
  { slug: 'iswaryamenon', name: 'Ishwarya Menon', age: 30, rating: 69, basePrice: 4000000 },
  { slug: 'amrithaaiyer', name: 'Amritha Aiyer', age: 28, rating: 68, basePrice: 3800000 },
  { slug: 'anupama', name: 'Anupama Parameswaran', age: 28, rating: 67, basePrice: 3600000 },
  { slug: 'preethi', name: 'Preethi', age: 26, rating: 66, basePrice: 3400000 },
  { slug: 'niddhiagarwal', name: 'Nidhhi Agerwal', age: 33, rating: 65, basePrice: 3200000 },
  { slug: 'malavikamanoj', name: 'Malavika Manoj', age: 24, rating: 64, basePrice: 3000000 },
  { slug: 'kashmira', name: 'Kashmira', age: 27, rating: 63, basePrice: 2800000 },
  { slug: 'divyabharathi', name: 'Divya Bharathi', age: 25, rating: 62, basePrice: 2600000 },
  { slug: 'meenakshi', name: 'Meenakshi', age: 24, rating: 61, basePrice: 2400000 },
  { slug: 'rithikasingh', name: 'Ritika Singh', age: 32, rating: 60, basePrice: 2200000 },
  { slug: 'riyasibu', name: 'Riya Sibu', age: 23, rating: 59, basePrice: 2000000 },
  { slug: 'rebamonica', name: 'Reba Monica John', age: 28, rating: 58, basePrice: 1800000 },
  { slug: 'saanavmeghna', name: 'Saanav Meghna', age: 24, rating: 57, basePrice: 1600000 },
  { slug: 'anika', name: 'Anika', age: 22, rating: 56, basePrice: 1200000 },
];

const actresses = ACTRESS_DEFS.map((a, index) => ({
  id: index + 1,
  slug: a.slug,
  name: a.name,
  age: a.age,
  rating: a.rating,
  basePrice: a.basePrice,
  image: imagePath(a.slug),
}));

module.exports = actresses;
