const CATEGORIES = ["Recycling", "Waste Reduction", "Reusable Items", "Energy Saving", "Sustainable Shopping", "Eco-Friendly Habits", "Other"];
const UNITS = ["Actions", "Items", "Days", "Times", "kg"];
const PERIODS = ["Weekly", "Monthly", "Custom"];
const ICONS = ["recycle", "leaf", "shopping-outline", "lightbulb-outline", "water-outline", "sprout", "trash-can-outline", "earth"];
const SUGGESTIONS = [
  { title: "Recycle 10 Items", category: "Recycling", targetAmount: 10, unit: "Items", icon: "recycle", period: "Monthly", description: "Give everyday materials another life by recycling them." },
  { title: "Use Reusable Bags 10 Times", category: "Reusable Items", targetAmount: 10, unit: "Times", icon: "shopping-outline", period: "Monthly", description: "Bring a reusable bag on shopping trips." },
  { title: "Complete 7 Eco-Friendly Actions", category: "Eco-Friendly Habits", targetAmount: 7, unit: "Actions", icon: "sprout", period: "Weekly", description: "Make one small sustainable choice each day." },
  { title: "Avoid Single-Use Plastic for 7 Days", category: "Waste Reduction", targetAmount: 7, unit: "Days", icon: "water-outline", period: "Weekly", description: "Choose reusable alternatives to single-use plastics." },
  { title: "Reduce Household Waste", category: "Waste Reduction", targetAmount: 5, unit: "kg", icon: "trash-can-outline", period: "Monthly", description: "Track the weight of waste you prevent or divert from disposal." },
  { title: "Practice Energy Saving for 7 Days", category: "Energy Saving", targetAmount: 7, unit: "Days", icon: "lightbulb-outline", period: "Weekly", description: "Build a daily habit of switching off unused lights and appliances." },
];
module.exports = { CATEGORIES, UNITS, PERIODS, ICONS, SUGGESTIONS };
