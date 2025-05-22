
// =========================================
// 2. Affichage de la date et l'heure en temps réel
// =========================================
function afficherDateHeure() {
  const maintenant = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  const dateHeure = document.getElementById("date-heure");
  if (dateHeure) {
    dateHeure.innerHTML = maintenant.toLocaleDateString("fr-FR", options);
  }
}
setInterval(afficherDateHeure, 1000);
afficherDateHeure();


// =========================================
// 3. Fonction pour voter pour un secteur
// =========================================
async function voterSecteur(secteurId, reponse) {
  try {
    const response = await fetch('/voter-secteur', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secteurId, reponse })
    });

    if (!response.ok) throw new Error('Erreur serveur');
    const data = await response.json();

    if (data.success) {
      // 1. Mise à jour des votes
      document.getElementById(`oui-${secteurId}`).textContent = data.updatedVotesOui;
      document.getElementById(`non-${secteurId}`).textContent = data.updatedVotesNon;
      document.getElementById('total-votants').textContent = data.totalVotants;

      // 2. Mise à jour du pourcentage
      const satisfactionFixe = data.satisfactionFixe.toFixed(2);
      document.getElementById(`pourcentage-${secteurId}`).textContent = satisfactionFixe + '%';

      // 3. Animation de la barre
      const progressBar = document.getElementById(`progression-${secteurId}`);
      progressBar.style.transition = 'width 0.5s ease-in-out';
      progressBar.style.width = satisfactionFixe + '%';
      progressBar.textContent = satisfactionFixe + '%';

      // 4. Message de feedback
      const feedback = document.getElementById(`feedback-${secteurId}`);
      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerText = "Merci pour votre vote ! 🙏";
        setTimeout(() => {
          feedback.style.display = 'none';
        }, 3000);
      }

    } else {
      alert('Erreur lors du vote.');
    }

  } catch (error) {
    console.error('Erreur lors de l\'envoi du vote :', error);
    alert('Erreur serveur.');
  }
}


// =========================================
// 6. Vérifier si une image existe
// =========================================
function checkImageExists(url, callback) {
  const img = new Image();
  img.onload = () => callback(true);
  img.onerror = () => callback(false);
  img.src = url;
}

// =========================================
// 7. Afficher image candidat ou image par défaut
// =========================================
function displayImage(candidat) {
  const imagePath = `/uploads/${candidat.photo}`;
  const imageElement = document.querySelector(`#photo-candidat-${candidat.id}`);
  checkImageExists(imagePath, (exists) => {
    if (imageElement) {
      imageElement.src = exists ? imagePath : "/uploads/default.jpg";
    }
  });
}




//===============================
//incrementation vote secteur
//============================
  document.addEventListener('DOMContentLoaded', function () {
    const buttons = document.querySelectorAll('.vote-btn');
        fetch('/voter-secteur', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secteurId, reponse })
        })

        .then(response => {
          if (!response.ok) {
            // vote refusé, donc NE PAS incrémenter
            afficherMessageErreur(); // ton message sympa ici
            return;
          }
          return response.json(); // vote accepté
        })
        .then(data => {
          if (data && data.message) {
            // ici, seulement si le vote est accepté
            incrementerVoteVisuel();
            afficherMessageSucces();
          }
        });
      
      });

  
  //=====================================================================================
  //message de remerciment d'avoir voter oui ou non et barre progressive secteurs
  //======================================================================================
  
  document.querySelectorAll('.vote-btn').forEach(button => {
      button.addEventListener('click', function () {
          const secteurId = this.getAttribute('data-secteur');
          const reponse = this.getAttribute('data-reponse');
          const progressBar = document.getElementById('progression-' + secteurId);
          const voteForm = document.getElementById('voteForm-' + secteurId);
  
          if (!progressBar || !voteForm) return;
  
          // Animation de la barre
          progressBar.style.transition = 'width 0.8s ease, background-color 0.8s ease';
          progressBar.style.backgroundColor = (reponse === 'oui') ? 'green' : 'red';
          progressBar.style.width = '100%';
  
          // Désactiver les boutons
          voteForm.querySelectorAll('.vote-btn').forEach(btn => btn.disabled = true);
  
          // Retirer l'ancien message s'il existe
          let oldMessage = document.querySelector(`#message-${secteurId}`);
          if (oldMessage) oldMessage.remove();
  
          // Créer un nouveau message
          const message = document.createElement('div');
          message.id = `message-${secteurId}`;
          message.textContent = `Merci d'avoir voté ${reponse === 'oui' ? 'Oui' : 'Non'} !`;
          message.style.marginTop = '10px';
          message.style.padding = '8px';
          message.style.backgroundColor = '#ffffff'; // vert clair
          message.style.color = '#155724'; // texte vert foncé
          message.style.border = '1px solid #c3e6cb';
          message.style.borderRadius = '4px';
  
          // Ajouter le message sous le formulaire
          voteForm.parentNode.insertBefore(message, voteForm.nextSibling);
  
          // Revenir à l'état normal de la barre après 2 secondes
          setTimeout(() => {
              progressBar.style.backgroundColor = '#080df4'; // bleu normal
              progressBar.style.width = progressBar.getAttribute('data-pourcentage') + '%';
          }, 2000);
      });
  });
   


  // Appel au chargement + mise à jour toutes les 10 secondes
  window.addEventListener('DOMContentLoaded', () => {
    refreshTopCandidat();
    setInterval(refreshTopCandidat, 10000);
  });

  async function chargerEtAfficherStats() {
    try {
      const response = await fetch('/api/stats-completes');
      const data = await response.json();
  
      if (data.success) {
        // 1. Afficher les totaux globaux
        document.getElementById('total-candidats').textContent = data.totalGlobal.candidats;
        document.getElementById('total-secteurs').textContent = data.totalGlobal.secteurs;
  
        // 2. Mettre à jour les candidats
        const containerCandidats = document.getElementById('liste-candidats');
        containerCandidats.innerHTML = data.candidats.map(candidat => `
          <div class="candidat">
            <h3>${candidat.nom}</h3>
            <div class="progress-bar" 
                 style="width: ${candidat.pourcentage}%"
                 data-percent="${candidat.pourcentage}">
              ${candidat.pourcentage}%
            </div>
            <p>Votes: ${candidat.votes} (${candidat.pourcentage}%)</p>
          </div>
        `).join('');
  
        // 3. Mettre à jour les secteurs
        const containerSecteurs = document.getElementById('liste-secteurs');
        containerSecteurs.innerHTML = data.secteurs.map(secteur => `
          <div class="secteur">
            <h4>${secteur.nom}</h4>
            <div class="satisfaction-bar" 
                 style="width: ${secteur.pourcentageSatisfaction}%">
              ${secteur.pourcentageSatisfaction}%
            </div>
            <p>Oui: ${secteur.votes_oui} | Non: ${secteur.votes_non}</p>
            <p>Total: ${secteur.totalVotes}</p>
          </div>
        `).join('');
  
        // 4. Animer les barres après chargement
        animerToutesLesBarres();
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  }
  

 





//=====================================
// barre progressive des candidats
//======================================
function animerBarre(candidatId) {
  const barre = document.getElementById(`progress-bar-${candidatId}`);
  if (!barre) return;

  const pourcentageReel = parseFloat(barre.getAttribute('data-percent')) || 0;

  // Étape 1 : on simule un remplissage à 100%
  barre.style.width = '100%';
  barre.innerText = '100%';

  // Étape 2 : après 1.5s, on revient au pourcentage réel
  setTimeout(() => {
    barre.style.width = `${pourcentageReel}%`;
    barre.innerText = `${pourcentageReel.toFixed(1)}%`;
  }, 1500);
}



// =========================================
// 5. Chargement dynamique des candidats
// =========================================
async function loadCandidats() {
  try {
    const response = await fetch("/votes");
    if (!response.ok) throw new Error("Erreur de chargement !");
    const candidats = await response.json();

    const candidatsDiv = document.getElementById("candidats");
    if (candidatsDiv) {
      candidatsDiv.innerHTML = "";
      candidats.forEach(candidat => {
        const div = document.createElement("div");
        div.className = "candidat";
        div.innerHTML = `
          <h3>${candidat.nom} (${candidat.parti})</h3>
          <img src="/uploads/${candidat.photo}" alt="${candidat.nom}" id="photo-candidat-${candidat.id}" />
          <p>Votes: <span id="vote-count-${candidat.id}">${candidat.votes}</span> <span></span></p>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width:0%"></div>
          </div>
          <button class="vote-button" data-candidat-id="${candidat.id}">Voter</button>
          <p id="message-${candidat.id}" class="message-success" style="display:none;"></p>
        `;
        candidatsDiv.appendChild(div);

        // Vérification image
        displayImage(candidat);
      });

      // Ajouter écouteurs de vote
      document.querySelectorAll(".vote-button").forEach(button => {
        button.addEventListener("click", () => {
          const candidatId = button.getAttribute("data-candidat-id");
          voterCandidat(candidatId);
        });
      });
    }
  } catch (error) {
    console.error("Erreur lors du chargement des candidats :", error);
  }
}

// =========================================
// Initialisation au chargement
// =========================================

document.addEventListener('DOMContentLoaded', () => {
  // Écouteurs pour les boutons de vote
  document.querySelectorAll('[data-candidat-id]').forEach(btn => {
    btn.addEventListener('click', (e) => voterC(btn.dataset.candidatId, e));
  });
  
  // Chargement initial
  chargerDonneesInitiales();
});

/**
 * Charge les données initiales
 */
async function chargerDonneesInitiales() {
  try {
    const response = await fetch('/api/candidats');
    const data = await response.json();
    
    if (data.success) {
      data.candidats.forEach(candidat => {
        const pourcentage = calculerPourcentageSecurise(candidat.votes, data.totalVotes);
        const barre = document.getElementById(`progress-bar-${candidat.id}`);
        if (barre) {
          barre.style.width = `${pourcentage}%`;
          barre.textContent = `${pourcentage}%`;
        }
      });
    }
  } catch (error) {
    console.error('Erreur chargement:', error);
  }
}






// =========================================
// FONCTION DE VOTE SECTEUR CORRIGÉE
// =========================================

/**
 * Envoie un vote pour un secteur
 * @param {string} secteurId - ID du secteur
 * @param {string} reponse - Réponse ('oui' ou 'non')
 * @param {Event} event - Événement de clic
 */
async function voterSecteur(secteurId, reponse, event) {
  if (event) event.preventDefault();

  try {
    const btn = event?.target;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> En cours...';
    }

    // CORRECTION: Format JSON standard
    const response = await fetch('/voter-secteur', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Important: spécifier le type de contenu
      },
      body: JSON.stringify({
        secteurId: secteurId,
        reponse: reponse
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Erreur lors du vote');
    }

    // Mise à jour de l'interface
    updateUIAfterSecteurVote(data, secteurId, reponse);

  } catch (error) {
    console.error('Erreur lors du vote secteur:', error);
    showErrorMessage(`Échec du vote: ${error.message}`);
  } finally {
    const btn = event?.target;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = reponse === 'oui' ? 'Oui' : 'Non';
    }
  }
}

/**
 * Met à jour l'interface après un vote secteur
 */
function updateUIAfterSecteurVote(data, secteurId, reponse) {
  // 1. Mise à jour des compteurs
  const ouiElement = document.getElementById(`oui-${secteurId}`);
  const nonElement = document.getElementById(`non-${secteurId}`);
  const totalElement = document.getElementById('total-votants');

  if (ouiElement) ouiElement.textContent = data.updatedVotesOui || 0;
  if (nonElement) nonElement.textContent = data.updatedVotesNon || 0;
  if (totalElement) totalElement.textContent = data.totalVotants || 0;

  // 2. Mise à jour du pourcentage
  const satisfaction = data.satisfactionFixe?.toFixed(2) || 0;
  const pourcentageElement = document.getElementById(`pourcentage-${secteurId}`);
  if (pourcentageElement) pourcentageElement.textContent = `${satisfaction}%`;

  // 3. Animation de la barre
  const progressBar = document.getElementById(`progression-${secteurId}`);
  if (progressBar) {
    progressBar.style.transition = 'width 0.5s ease, background-color 0.5s ease';
    progressBar.style.width = `${satisfaction}%`;
    progressBar.textContent = `${satisfaction}%`;
    progressBar.style.backgroundColor = reponse === 'oui' ? '#4CAF50' : '#F44336';
  }

  // 4. Message de confirmation
  showConfirmationMessage(
    document.getElementById(`feedback-${secteurId}`),
    `Votre vote "${reponse}" a été enregistré!`,
    3000
  );
}

document.addEventListener('DOMContentLoaded', function() {
  const progressBars = document.querySelectorAll('.progress-barC');
  
  progressBars.forEach(bar => {
      const targetWidth = bar.getAttribute('data-percentage') || bar.textContent.trim();
      const percentage = parseFloat(targetWidth.replace('%', ''));
      
      bar.style.width = '0%';
      bar.textContent = '0%';
      
      // Ajout de classe en fonction du pourcentage
      if (percentage < 30) {
          bar.classList.add('low');
      } else if (percentage < 70) {
          bar.classList.add('medium');
      } else {
          bar.classList.add('high');
      }
      
      let currentWidth = 0;
      const animationDuration = 1500;
      const increment = percentage / (animationDuration / 16);
      
      const animate = () => {
          currentWidth += increment;
          if (currentWidth >= percentage) {
              currentWidth = percentage;
              bar.style.width = `${currentWidth}%`;
              bar.textContent = `${Math.round(currentWidth)}%`;
              return;
          }
          
          bar.style.width = `${currentWidth}%`;
          bar.textContent = `${Math.round(currentWidth)}%`;
          requestAnimationFrame(animate);
      };
      
      setTimeout(animate,200);
  });
});

