(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; send-many
(define-public (send-ft-with-memo (amount uint) (to principal) (memo (buff 34)) (ft <ft-trait>))
 (let ((transfer-ok (try! (contract-call? ft transfer amount tx-sender to (some memo)))))
   (print memo)
   (ok transfer-ok)))

(define-private (send-ft (recipient { to: principal, amount: uint, memo: (buff 34)}) (ft <ft-trait>))
  (begin (unwrap-panic (send-ft-with-memo
     (get amount recipient)
     (get to recipient)
     (get memo recipient)
     ft))
  ft))

(define-public (send-many (recipients (list 200 { to: principal, amount: uint, memo: (buff 34)})) (ft <ft-trait> ))
  (ok (fold send-ft recipients ft)))
