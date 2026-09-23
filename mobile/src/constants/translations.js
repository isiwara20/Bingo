export const UI_TEXT = {
  en: { home:"Home", report:"Report", map:"Map", schedule:"Schedule", community:"Community", recycle:"Recycle", profile:"Profile", settings:"Settings", preferences:"Preferences" },
  si: { home:"මුල් පිටුව", report:"වාර්තා", map:"සිතියම", schedule:"කාලසටහන", community:"ප්‍රජාව", recycle:"ප්‍රතිචක්‍රීකරණය", profile:"පැතිකඩ", settings:"සැකසුම්", preferences:"මනාප" },
  ta: { home:"முகப்பு", report:"அறிக்கை", map:"வரைபடம்", schedule:"அட்டவணை", community:"சமூகம்", recycle:"மீள்சுழற்சி", profile:"சுயவிவரம்", settings:"அமைப்புகள்", preferences:"விருப்பங்கள்" },
};
export const getUiText = language => UI_TEXT[language] || UI_TEXT.en;
