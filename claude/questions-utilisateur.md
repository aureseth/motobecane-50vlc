# Questions à l'utilisateur — échanges asynchrones

Objectif : éviter d'attendre une réponse en direct pour une question qui ne bloque pas le travail en cours, et économiser des tokens en évitant de recoller du contexte. Fonctionnement :

1. Quand une question se pose qui n'empêche pas de continuer (pas un choix irréversible ou coûteux, pas un vrai blocage), je l'ajoute dans la section **🟡 En attente de réponse** ci-dessous plutôt que d'interrompre la session.
2. Tu réponds directement sous la question, à ton rythme, entre deux sessions.
3. Au début de la session suivante, je lis ce fichier. S'il y a une réponse sous une question :
   - j'applique la réponse dans le travail (code, doc, décision) ;
   - je déplace la question (résumée en une ligne) vers le **📜 Journal des questions traitées** avec la date du jour, format `- [JJ/MM/AAAA] <résumé de la question> : <résumé de la réponse/action>` ;
   - je retire la question de la section "En attente" pour que ce fichier reste court.
4. Si une question reste sans réponse, elle reste simplement dans "En attente" — pas de relance automatique, pas de pression.

Les vraies questions bloquantes (danger, coût important, choix qui ne peut pas attendre) continuent d'être posées en direct dans la conversation, pas ici.

---

## 🟡 En attente de réponse

*(aucune question en attente pour l'instant)*

---

## 📜 Journal des questions traitées

*(les entrées apparaîtront ici au fur et à mesure, par exemple : « - [12/11/2026] Avance à l'allumage SHA15 : réponse appliquée, protocole 1,7-2mm intégré au tutoriel. »)*
