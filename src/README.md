# améliorations


* normalisation de la vue
  * normaliser les proportions, mouvements de cameras afin d'enlever l'effet de perspective
* ségmentation colorimétrique, détection de feature points
  * détection du pied dans son ensemble afin de rendre plus précis les points clés de la pose du pied
  * amélioration des autres poins clés (genoux, tête)
* proportionalité
  * utiliser les rapport de proportionalités pour corriger les erreurs du model de détection (ex. taille du pied doit rester la même)
  * calcul des distances en cm à partir de la taille de la personne
* interpolation temporelle des mouvements
  * réduction du bruit en interpolant et en éliminant les données aberrantes
* autres
  * la segmentation colorimétrique peut être grandement améliorée en y ajoutant des données temporelles (ex couleur des chaussures)




### Calcul du sol

Le sol permettra de calculer la longeur principale des pas