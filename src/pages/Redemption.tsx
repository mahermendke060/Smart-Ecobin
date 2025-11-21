import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Redemption = () => {
  return (
    <div className="space-y-6">

      <Card className="border-eco-light/30">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-eco">Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We are building a seamless redemption experience. Soon you’ll be able to redeem eco points for exciting rewards and INR balance. Stay tuned!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Redemption;
