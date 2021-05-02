;;
;; vault functions
;;

;; balance per cycle
(define-constant off-cycle-vault u0)
(define-map vaults uint int)

;; only the contract itself can make payouts
(define-private (payout (user principal) (ustx uint) (cycle uint))
  (begin
    (map-set vaults cycle (- (default-to 0 (map-get? vaults cycle)) (to-int ustx)))
    (as-contract (stx-transfer? ustx tx-sender user))))

;; Anybody can pay into the contract. The amount will be accounted for the given cycle.
(define-public (payin (ustx uint) (cycle uint))
  (begin
    (map-set vaults cycle (+ (default-to 0 (map-get? vaults cycle)) (to-int ustx)))
    (stx-transfer? ustx tx-sender (as-contract tx-sender))))

;;
;; stacking functions
;;

;; pool specific constants
(define-constant pool-account (as-contract tx-sender))
(define-constant pool-pox-address {hashbytes: 0x13effebe0ea4bb45e35694f5a15bb5b96e851afb, version: 0x01})

;; stacking constants
(define-constant cycles (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11))

(define-map stacked-stxs {stacker: principal, cycle: uint}
  {
    amount-ustx: uint,
    stacked-ustx: uint,
    until-burn-ht: (optional uint),
    rewards: (optional uint)})



;; Backport of .pox's burn-height-to-reward-cycle
(define-private (burn-height-to-reward-cycle (height uint))
    (let (
        (pox-info (unwrap-panic (contract-call? 'ST000000000000000000002AMW42H.pox get-pox-info)))
    )
    (/ (- height (get first-burnchain-block-height pox-info)) (get reward-cycle-length pox-info)))
)

;; Backport of .pox's reward-cycle-to-burn-height
(define-private (reward-cycle-to-burn-height (cycle uint))
    (let (
        (pox-info (unwrap-panic (contract-call? 'ST000000000000000000002AMW42H.pox get-pox-info)))
    )
    (+ (get first-burnchain-block-height pox-info) (* cycle (get reward-cycle-length pox-info))))
)

;; What's the current PoX reward cycle?
(define-private (current-pox-reward-cycle)
    (burn-height-to-reward-cycle burn-block-height))


(define-read-only (get-next-cycle)
  (+ (current-pox-reward-cycle) u1)
)

(define-private (pox-delegate-stx-and-stack (amount-ustx uint) (until-burn-ht (optional uint)) (locking-period uint))
  (begin
    (let ((ignore-result-revoke (contract-call? 'ST000000000000000000002AMW42H.pox revoke-delegate-stx))
          (start-block-ht (+ burn-block-height u1)))
      (match (contract-call? 'ST000000000000000000002AMW42H.pox delegate-stx amount-ustx pool-account until-burn-ht none)
        success
          (let ((stacker tx-sender))
            (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox delegate-stack-stx stacker amount-ustx pool-pox-address start-block-ht locking-period))
              stack-success (ok stack-success)
              stack-error (print (err (to-uint stack-error)))))
        error (err (to-uint error))))))


(define-private (insert-stacked-stxs (cycle-index uint) (context {stacker: principal, cycle: uint, amount-ustx: uint, stacked-ustx: uint, until-burn-ht: (optional uint), result: bool}))
  (let ((result
          (map-insert stacked-stxs {stacker: (get stacker context), cycle: (get cycle context)}
            {amount-ustx: (get amount-ustx context), stacked-ustx: (get stacked-ustx context),
              until-burn-ht: (get until-burn-ht context), rewards: none})))
    (merge context {result: (and (get result context) result)})))

(define-private (delegatedly-stack (stacker principal) (amount-ustx uint)
      (until-burn-ht (optional uint)) (cycle uint) (locking-period uint))
  (begin
      (asserts! (>= (stx-get-balance tx-sender) amount-ustx) err-not-enough-funds)
      (asserts! (is-none (map-get? stacked-stxs {stacker: stacker, cycle: cycle})) err-already-stacked)
      (match (pox-delegate-stx-and-stack amount-ustx until-burn-ht locking-period)
        success-pox
              (begin
                (asserts! (get result
                  (fold insert-stacked-stxs cycles {stacker: stacker, cycle: cycle,
                    amount-ustx: amount-ustx, stacked-ustx: (get lock-amount success-pox),
                    until-burn-ht: until-burn-ht, result: true}))
                    err-map-function-failed)
                (ok success-pox))
        error-pox (err error-pox))))



;; every user can delegate and stack their stacks
(define-public (delegate-stx (amount-ustx uint) (stacker principal)
                  (until-burn-ht (optional uint))
                  (pox-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1)))))
                  (user-addr (optional (tuple (hashbytes (buff 20)) (version (buff 1)))))
                  (locking-period uint))
  (let ((cycle (get-next-cycle)))
    (asserts! (or (is-eq stacker tx-sender) (is-eq stacker contract-caller)) err-delegate-invalid-stacker)
    (delegatedly-stack stacker amount-ustx until-burn-ht cycle locking-period)))


;; anybody can close the pool within the window before the start of the next cycle
(define-public (stack-aggregation-commit (reward-cycle uint))
  (let ((cycle-start (reward-cycle-to-burn-height reward-cycle)))
    (if (and (>= burn-block-height (- cycle-start u50)) (< burn-block-height cycle-start))
      (match (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox stack-aggregation-commit pool-pox-address reward-cycle))
        success (begin
                  (unwrap! (payout tx-sender u1000000 reward-cycle) err-payout-failed)
                  (ok success))
        error (err-pox-stack-aggregation-commit error))
      err-commit-not-allowed-now)))


;; only one user can call this function
(define-data-var delegation-enabler (optional principal) none)
(define-public (allow-contract-caller (this-contract principal))
  (match (var-get delegation-enabler)
    enabler (ok enabler)
    (let ((enabler tx-sender))
      (unwrap! (as-contract (contract-call? 'ST000000000000000000002AMW42H.pox allow-contract-caller this-contract none)) err-allow-contract-caller-failed)
      (unwrap! (payout tx-sender u1000000 off-cycle-vault) err-payout-failed)
      (var-set delegation-enabler (some enabler))
      (ok enabler))))
;;
;; error handling
;;
(define-constant err-not-enough-funds (err u4021)) ;; payment required
(define-constant err-allow-contract-caller-failed (err u601))
(define-constant err-delegate-below-minimum (err u602))
(define-constant err-delegate-invalid-stacker (err u603))
(define-constant err-commit-not-allowed-now (err u604))
(define-constant err-already-stacked (err u605))
(define-constant err-map-function-failed (err u606))
(define-constant err-payout-failed (err u701))

(define-private (err-pox-stack-aggregation-commit (code int))
  (err (to-uint (* 1000 code))))
