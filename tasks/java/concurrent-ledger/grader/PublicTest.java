import java.util.concurrent.CountDownLatch;

public final class PublicTest {
    public static void main(String[] args) throws Exception {
        Ledger ledger = new Ledger(7);
        ledger.credit(5);
        if (ledger.balance() != 12) throw new AssertionError("sequential credit failed");
        assertConcurrentCredits(new Ledger(0), 8, 20_000);
        System.out.println("public ledger contract passed");
    }

    static void assertConcurrentCredits(Ledger ledger, int workers, int iterations) throws Exception {
        CountDownLatch ready = new CountDownLatch(workers);
        CountDownLatch start = new CountDownLatch(1);
        Thread[] threads = new Thread[workers];
        for (int i = 0; i < workers; i++) {
            threads[i] = new Thread(() -> {
                ready.countDown();
                try { start.await(); } catch (InterruptedException e) { throw new RuntimeException(e); }
                for (int j = 0; j < iterations; j++) ledger.credit(1);
            });
            threads[i].start();
        }
        ready.await(); start.countDown();
        for (Thread thread : threads) thread.join();
        long expected = (long) workers * iterations;
        if (ledger.balance() != expected) throw new AssertionError("lost credits: " + ledger.balance() + " != " + expected);
    }
}
