import java.util.concurrent.atomic.AtomicLong;

public final class Ledger {
    private final AtomicLong balance;
    public Ledger(long openingBalance) { this.balance = new AtomicLong(openingBalance); }
    public void credit(long amount) {
        if (amount < 0) throw new IllegalArgumentException("amount must be positive");
        balance.addAndGet(amount);
    }
    public long balance() { return balance.get(); }
}

