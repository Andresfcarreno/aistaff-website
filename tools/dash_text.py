# -*- coding: utf-8 -*-
"""Textos de la muestra interactiva del dashboard (pestañas) en las páginas generadas. FR / EN / ES.
Los datos (llamadas, estadísticas, guion) vienen de cada sector; esto solo pone los rótulos y plantillas."""

DASH = {
"fr": {
    "tabs": ["Aperçu", "Appels", "Messages", "Agenda", "Réseaux", "Contacts"],
    "chart": "Appels répondus cette semaine", "days": ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    "recent": "Derniers appels", "transcript": "Transcription", "free": "Libre", "week": "Cette semaine",
    "sms": "Bonjour {n}, c'est {a}. C'est confirmé : {x}. À bientôt!", "sent": "Envoyé", "smsLbl": "SMS · confirmation",
    "wa": ["WhatsApp", "Un client demande vos heures d'ouverture.", "{a} répond avec vos heures et propose un rendez-vous.", "Par phases"],
    "soc": [["Instagram", "📸", [["Portée", "2 340"], ["Messages", "18"], ["Nouveaux abonnés", "+27"]]], ["Facebook", "📘", [["Portée", "1 120"], ["Messages", "9"], ["Mentions J'aime", "+14"]]]],
    "socNote": "Instagram et Facebook : plan Complet, par phases.",
    "last": "Dernier contact", "contactsNote": "Chaque appelant devient un contact, avec son historique.",
},
"en": {
    "tabs": ["Overview", "Calls", "Messages", "Calendar", "Social", "Contacts"],
    "chart": "Calls answered this week", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "recent": "Latest calls", "transcript": "Transcript", "free": "Open", "week": "This week",
    "sms": "Hi {n}, this is {a}. You're confirmed: {x}. See you soon!", "sent": "Sent", "smsLbl": "SMS · confirmation",
    "wa": ["WhatsApp", "A customer asks for your opening hours.", "{a} replies with your hours and offers an appointment.", "In phases"],
    "soc": [["Instagram", "📸", [["Reach", "2,340"], ["Messages", "18"], ["New followers", "+27"]]], ["Facebook", "📘", [["Reach", "1,120"], ["Messages", "9"], ["New likes", "+14"]]]],
    "socNote": "Instagram and Facebook: Complete plan, in phases.",
    "last": "Last contact", "contactsNote": "Every caller becomes a contact, with their history.",
},
"es": {
    "tabs": ["Resumen", "Llamadas", "Mensajes", "Agenda", "Redes", "Contactos"],
    "chart": "Llamadas atendidas esta semana", "days": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    "recent": "Últimas llamadas", "transcript": "Transcripción", "free": "Libre", "week": "Esta semana",
    "sms": "Hola {n}, soy {a}. Quedó confirmado: {x}. ¡Hasta pronto!", "sent": "Enviado", "smsLbl": "SMS · confirmación",
    "wa": ["WhatsApp", "Un cliente pregunta por tu horario de atención.", "{a} responde con tu horario y propone una cita.", "Por fases"],
    "soc": [["Instagram", "📸", [["Alcance", "2 340"], ["Mensajes", "18"], ["Nuevos seguidores", "+27"]]], ["Facebook", "📘", [["Alcance", "1 120"], ["Mensajes", "9"], ["Nuevos me gusta", "+14"]]]],
    "socNote": "Instagram y Facebook: plan Completo, por fases.",
    "last": "Último contacto", "contactsNote": "Cada persona que llama se vuelve un contacto, con su historial.",
},
}
